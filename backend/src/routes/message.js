const express = require('express')
const database = require('../../config/database')
const logger = require('../utils/logger')
const { validateMessageSend } = require('../validators/messageValidator')
const socketService = require('../services/socketService')
const uploadService = require('../services/uploadService')

const router = express.Router()

/**
 * 发送消息
 * POST /api/message/send
 */
router.post('/send', async (req, res) => {
  try {
    const { error } = validateMessageSend(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const userId = req.user.userId
    const { consultationId, messageType, content, extra } = req.body

    // 检查咨询是否存在且用户有权限
    const consultation = await getConsultationById(consultationId)
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权在此咨询中发送消息'
      })
    }

    if (consultation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: '咨询已结束，无法发送消息'
      })
    }

    // 创建消息
    const messageId = await createMessage({
      consultationId,
      senderType: 'user',
      senderId: userId,
      messageType,
      content,
      extra
    })

    // 获取完整消息信息
    const message = await getMessageById(messageId)

    // 更新咨询最后活动时间
    await updateConsultationActivity(consultationId)

    // 实时推送消息
    socketService.sendMessage(consultationId, message)

    // 如果有客服，通知客服
    if (consultation.staff_id) {
      socketService.notifyStaff(consultation.staff_id, 'new_message', {
        consultationId,
        message
      })
    }

    res.json({
      success: true,
      message: '消息发送成功',
      data: {
        messageId,
        message
      }
    })

  } catch (error) {
    logger.error('发送消息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 撤回消息
 * POST /api/message/:id/recall
 */
router.post('/:id/recall', async (req, res) => {
  try {
    const userId = req.user.userId
    const messageId = req.params.id
    
    const message = await getMessageById(messageId)
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      })
    }

    // 检查权限
    if (message.sender_type !== 'user' || message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权撤回此消息'
      })
    }

    // 检查时间限制（2分钟内可撤回）
    const now = new Date()
    const messageTime = new Date(message.created_at)
    const timeDiff = (now - messageTime) / 1000 / 60 // 分钟
    
    if (timeDiff > 2) {
      return res.status(400).json({
        success: false,
        message: '消息发送超过2分钟，无法撤回'
      })
    }

    await recallMessage(messageId)

    // 实时通知撤回
    socketService.recallMessage(message.consultation_id, messageId)

    res.json({
      success: true,
      message: '消息撤回成功'
    })
  } catch (error) {
    logger.error('撤回消息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 删除消息
 * DELETE /api/message/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const messageId = req.params.id
    
    const message = await getMessageById(messageId)
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      })
    }

    // 检查权限
    if (message.sender_type !== 'user' || message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此消息'
      })
    }

    await deleteMessage(messageId)

    res.json({
      success: true,
      message: '消息删除成功'
    })
  } catch (error) {
    logger.error('删除消息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 标记消息已读
 * POST /api/message/read
 */
router.post('/read', async (req, res) => {
  try {
    const userId = req.user.userId
    const { consultationId, messageIds } = req.body
    
    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: '缺少咨询ID'
      })
    }

    // 检查咨询权限
    const consultation = await getConsultationById(consultationId)
    if (!consultation || consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此咨询'
      })
    }

    if (messageIds && messageIds.length > 0) {
      // 标记指定消息已读
      await markMessagesRead(messageIds, userId)
    } else {
      // 标记咨询中所有未读消息已读
      await markConsultationMessagesRead(consultationId, userId)
    }

    // 通知客服用户已读消息
    if (consultation.staff_id) {
      socketService.notifyStaff(consultation.staff_id, 'messages_read', {
        consultationId,
        userId
      })
    }

    res.json({
      success: true,
      message: '消息已标记为已读'
    })
  } catch (error) {
    logger.error('标记消息已读错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取未读消息数量
 * GET /api/message/unread-count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId
    const { consultationId } = req.query
    
    let unreadCount
    if (consultationId) {
      // 获取指定咨询的未读消息数
      unreadCount = await getConsultationUnreadCount(consultationId, userId)
    } else {
      // 获取用户所有未读消息数
      unreadCount = await getUserUnreadCount(userId)
    }

    res.json({
      success: true,
      data: {
        unreadCount
      }
    })
  } catch (error) {
    logger.error('获取未读消息数错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 搜索消息
 * GET /api/message/search
 */
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.userId
    const { keyword, consultationId, messageType, startDate, endDate, page = 1, limit = 20 } = req.query
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '缺少搜索关键词'
      })
    }

    const offset = (page - 1) * limit
    const messages = await searchMessages(userId, {
      keyword,
      consultationId,
      messageType,
      startDate,
      endDate,
      offset,
      limit: parseInt(limit)
    })

    const total = await searchMessagesCount(userId, {
      keyword,
      consultationId,
      messageType,
      startDate,
      endDate
    })

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('搜索消息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 数据库操作函数
async function getConsultationById(consultationId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM consultations WHERE id = ? AND deleted_at IS NULL',
    [consultationId]
  )
  return rows[0] || null
}

async function createMessage(data) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `INSERT INTO messages (consultation_id, sender_type, sender_id, message_type, content, extra, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      data.consultationId,
      data.senderType,
      data.senderId,
      data.messageType,
      data.content,
      JSON.stringify(data.extra || {})
    ]
  )
  return rows.insertId
}

async function getMessageById(messageId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT m.*, u.nickname as user_nickname, u.avatar as user_avatar,
            s.name as staff_name, s.avatar as staff_avatar
     FROM messages m
     LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
     LEFT JOIN staff s ON m.sender_type = 'staff' AND m.sender_id = s.id
     WHERE m.id = ? AND m.deleted_at IS NULL`,
    [messageId]
  )
  
  if (rows[0] && rows[0].extra) {
    try {
      rows[0].extra = JSON.parse(rows[0].extra)
    } catch (e) {
      rows[0].extra = {}
    }
  }
  
  return rows[0] || null
}

async function updateConsultationActivity(consultationId) {
  const db = database.getInstance()
  await db.query(
    'UPDATE consultations SET updated_at = NOW() WHERE id = ?',
    [consultationId]
  )
}

async function recallMessage(messageId) {
  const db = database.getInstance()
  await db.query(
    "UPDATE messages SET status = 'recalled', updated_at = NOW() WHERE id = ?",
    [messageId]
  )
}

async function deleteMessage(messageId) {
  const db = database.getInstance()
  await db.query(
    'UPDATE messages SET deleted_at = NOW() WHERE id = ?',
    [messageId]
  )
}

async function markMessagesRead(messageIds, userId) {
  const db = database.getInstance()
  const placeholders = messageIds.map(() => '?').join(',')
  await db.query(
    `UPDATE message_reads SET read_at = NOW() 
     WHERE message_id IN (${placeholders}) AND user_id = ? AND read_at IS NULL`,
    [...messageIds, userId]
  )
  
  // 如果记录不存在，创建已读记录
  for (const messageId of messageIds) {
    await db.query(
      `INSERT IGNORE INTO message_reads (message_id, user_id, read_at) VALUES (?, ?, NOW())`,
      [messageId, userId]
    )
  }
}

async function markConsultationMessagesRead(consultationId, userId) {
  const db = database.getInstance()
  
  // 获取咨询中所有未读消息
  const { rows } = await db.query(
    `SELECT m.id FROM messages m
     LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
     WHERE m.consultation_id = ? AND m.sender_type != 'user' AND mr.read_at IS NULL AND m.deleted_at IS NULL`,
    [userId, consultationId]
  )
  
  if (rows.length > 0) {
    const messageIds = rows.map(row => row.id)
    await markMessagesRead(messageIds, userId)
  }
}

async function getConsultationUnreadCount(consultationId, userId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT COUNT(*) as count FROM messages m
     LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
     WHERE m.consultation_id = ? AND m.sender_type != 'user' AND mr.read_at IS NULL AND m.deleted_at IS NULL`,
    [userId, consultationId]
  )
  return rows[0].count
}

async function getUserUnreadCount(userId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT COUNT(*) as count FROM messages m
     JOIN consultations c ON m.consultation_id = c.id
     LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
     WHERE c.user_id = ? AND m.sender_type != 'user' AND mr.read_at IS NULL AND m.deleted_at IS NULL`,
    [userId, userId]
  )
  return rows[0].count
}

async function searchMessages(userId, options) {
  const db = database.getInstance()
  let sql = `
    SELECT m.*, u.nickname as user_nickname, u.avatar as user_avatar,
           s.name as staff_name, s.avatar as staff_avatar,
           c.id as consultation_id
    FROM messages m
    JOIN consultations c ON m.consultation_id = c.id
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    LEFT JOIN staff s ON m.sender_type = 'staff' AND m.sender_id = s.id
    WHERE c.user_id = ? AND m.content LIKE ? AND m.deleted_at IS NULL
  `
  const params = [userId, `%${options.keyword}%`]
  
  if (options.consultationId) {
    sql += ' AND m.consultation_id = ?'
    params.push(options.consultationId)
  }
  
  if (options.messageType) {
    sql += ' AND m.message_type = ?'
    params.push(options.messageType)
  }
  
  if (options.startDate && options.endDate) {
    sql += ' AND m.created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }
  
  sql += ' ORDER BY m.created_at DESC'
  
  if (options.limit) {
    sql += ' LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset || 0)
  }
  
  const { rows } = await db.query(sql, params)
  
  // 解析extra字段
  rows.forEach(row => {
    if (row.extra) {
      try {
        row.extra = JSON.parse(row.extra)
      } catch (e) {
        row.extra = {}
      }
    }
  })
  
  return rows
}

async function searchMessagesCount(userId, options) {
  const db = database.getInstance()
  let sql = `
    SELECT COUNT(*) as count FROM messages m
    JOIN consultations c ON m.consultation_id = c.id
    WHERE c.user_id = ? AND m.content LIKE ? AND m.deleted_at IS NULL
  `
  const params = [userId, `%${options.keyword}%`]
  
  if (options.consultationId) {
    sql += ' AND m.consultation_id = ?'
    params.push(options.consultationId)
  }
  
  if (options.messageType) {
    sql += ' AND m.message_type = ?'
    params.push(options.messageType)
  }
  
  if (options.startDate && options.endDate) {
    sql += ' AND m.created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }
  
  const { rows } = await db.query(sql, params)
  return rows[0].count
}

module.exports = router