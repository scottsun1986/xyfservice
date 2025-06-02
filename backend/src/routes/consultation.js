const express = require('express')
const database = require('../../config/database')
const logger = require('../utils/logger')
const { validateConsultationCreate } = require('../validators/consultationValidator')
const socketService = require('../services/socketService')

const router = express.Router()

/**
 * 创建咨询
 * POST /api/consultation/create
 */
router.post('/create', async (req, res) => {
  try {
    const { error } = validateConsultationCreate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const userId = req.user.userId
    const { staffId, source, description } = req.body

    // 检查是否有进行中的咨询
    const activeConsultation = await getActiveConsultation(userId)
    if (activeConsultation) {
      return res.json({
        success: true,
        message: '已有进行中的咨询',
        data: {
          consultationId: activeConsultation.id,
          staffId: activeConsultation.staff_id,
          staffName: activeConsultation.staff_name,
          staffAvatar: activeConsultation.staff_avatar
        }
      })
    }

    let assignedStaffId = staffId
    let staffInfo = null

    if (staffId) {
      // 指定客服
      staffInfo = await getStaffById(staffId)
      if (!staffInfo || staffInfo.status === 'offline') {
        return res.status(400).json({
          success: false,
          message: '指定的客服不可用'
        })
      }
    } else {
      // 自动分配客服
      staffInfo = await getAvailableStaff()
      if (staffInfo) {
        assignedStaffId = staffInfo.id
      }
    }

    // 创建咨询记录
    const consultationId = await createConsultation({
      userId,
      staffId: assignedStaffId,
      source,
      description,
      status: assignedStaffId ? 'active' : 'waiting'
    })

    // 发送系统消息
    if (assignedStaffId) {
      await createSystemMessage(consultationId, `客服 ${staffInfo.name} 为您服务`)
      
      // 通知客服
      socketService.notifyStaff(assignedStaffId, 'new_consultation', {
        consultationId,
        userId,
        userInfo: req.user
      })
    } else {
      await createSystemMessage(consultationId, '正在为您分配客服，请稍候...')
    }

    res.json({
      success: true,
      message: '咨询创建成功',
      data: {
        consultationId,
        staffId: assignedStaffId,
        staffName: staffInfo?.name,
        staffAvatar: staffInfo?.avatar,
        status: assignedStaffId ? 'active' : 'waiting'
      }
    })

  } catch (error) {
    logger.error('创建咨询错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取咨询详情
 * GET /api/consultation/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此咨询'
      })
    }

    res.json({
      success: true,
      data: consultation
    })
  } catch (error) {
    logger.error('获取咨询详情错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取咨询消息
 * GET /api/consultation/:id/messages
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    const { page = 1, limit = 50 } = req.query
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此咨询'
      })
    }

    const offset = (page - 1) * limit
    const messages = await getConsultationMessages(consultationId, {
      offset,
      limit: parseInt(limit)
    })

    const total = await getConsultationMessagesCount(consultationId)

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
    logger.error('获取咨询消息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 结束咨询
 * POST /api/consultation/:id/close
 */
router.post('/:id/close', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    const { reason, rating, feedback } = req.body
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此咨询'
      })
    }

    if (!['active', 'waiting'].includes(consultation.status)) {
      return res.status(400).json({
        success: false,
        message: '咨询状态不允许结束'
      })
    }

    await closeConsultation(consultationId, {
      reason,
      rating,
      feedback,
      closedBy: 'user'
    })

    // 发送系统消息
    await createSystemMessage(consultationId, '用户已结束咨询')

    // 通知客服
    if (consultation.staff_id) {
      socketService.notifyStaff(consultation.staff_id, 'consultation_closed', {
        consultationId,
        reason
      })
    }

    res.json({
      success: true,
      message: '咨询结束成功'
    })
  } catch (error) {
    logger.error('结束咨询错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 评价咨询
 * POST /api/consultation/:id/rate
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    const { rating, feedback } = req.body
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      })
    }

    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权评价此咨询'
      })
    }

    if (consultation.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: '只能评价已结束的咨询'
      })
    }

    await rateConsultation(consultationId, {
      rating,
      feedback
    })

    res.json({
      success: true,
      message: '评价提交成功'
    })
  } catch (error) {
    logger.error('评价咨询错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 转接咨询
 * POST /api/consultation/:id/transfer
 */
router.post('/:id/transfer', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    const { targetStaffId, reason } = req.body
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此咨询'
      })
    }

    if (consultation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '只能转接进行中的咨询'
      })
    }

    // 检查目标客服
    const targetStaff = await getStaffById(targetStaffId)
    if (!targetStaff || targetStaff.status === 'offline') {
      return res.status(400).json({
        success: false,
        message: '目标客服不可用'
      })
    }

    await transferConsultation(consultationId, targetStaffId, reason)

    // 发送系统消息
    await createSystemMessage(consultationId, `咨询已转接给客服 ${targetStaff.name}`)

    // 通知相关客服
    if (consultation.staff_id) {
      socketService.notifyStaff(consultation.staff_id, 'consultation_transferred', {
        consultationId,
        targetStaffId
      })
    }
    
    socketService.notifyStaff(targetStaffId, 'consultation_received', {
      consultationId,
      userId
    })

    res.json({
      success: true,
      message: '咨询转接成功'
    })
  } catch (error) {
    logger.error('转接咨询错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 数据库操作函数
async function getActiveConsultation(userId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT c.*, s.name as staff_name, s.avatar as staff_avatar
     FROM consultations c
     LEFT JOIN staff s ON c.staff_id = s.id
     WHERE c.user_id = ? AND c.status IN ('waiting', 'active') AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC
     LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

async function getStaffById(staffId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL',
    [staffId]
  )
  return rows[0] || null
}

async function getAvailableStaff() {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT * FROM staff 
     WHERE status = 'online' AND deleted_at IS NULL
     ORDER BY RAND()
     LIMIT 1`
  )
  return rows[0] || null
}

async function createConsultation(data) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `INSERT INTO consultations (user_id, staff_id, source, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [data.userId, data.staffId, data.source, data.description, data.status]
  )
  return rows.insertId
}

async function createSystemMessage(consultationId, content) {
  const db = database.getInstance()
  await db.query(
    `INSERT INTO messages (consultation_id, sender_type, sender_id, message_type, content, created_at)
     VALUES (?, 'system', 0, 'text', ?, NOW())`,
    [consultationId, content]
  )
}

async function getConsultationById(consultationId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar,
            s.name as staff_name, s.avatar as staff_avatar
     FROM consultations c
     LEFT JOIN users u ON c.user_id = u.id
     LEFT JOIN staff s ON c.staff_id = s.id
     WHERE c.id = ? AND c.deleted_at IS NULL`,
    [consultationId]
  )
  return rows[0] || null
}

async function getConsultationMessages(consultationId, options = {}) {
  const db = database.getInstance()
  let sql = `
    SELECT m.*, u.nickname as user_nickname, u.avatar as user_avatar,
           s.name as staff_name, s.avatar as staff_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    LEFT JOIN staff s ON m.sender_type = 'staff' AND m.sender_id = s.id
    WHERE m.consultation_id = ? AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
  `
  const params = [consultationId]
  
  if (options.limit) {
    sql += ' LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset || 0)
  }
  
  const { rows } = await db.query(sql, params)
  return rows.reverse() // 返回时按时间正序
}

async function getConsultationMessagesCount(consultationId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT COUNT(*) as count FROM messages WHERE consultation_id = ? AND deleted_at IS NULL',
    [consultationId]
  )
  return rows[0].count
}

async function closeConsultation(consultationId, data) {
  const db = database.getInstance()
  await db.query(
    `UPDATE consultations SET 
     status = 'closed', 
     close_reason = ?, 
     rating = ?, 
     feedback = ?, 
     closed_by = ?,
     closed_at = NOW(), 
     updated_at = NOW() 
     WHERE id = ?`,
    [data.reason, data.rating, data.feedback, data.closedBy, consultationId]
  )
}

async function rateConsultation(consultationId, data) {
  const db = database.getInstance()
  await db.query(
    'UPDATE consultations SET rating = ?, feedback = ?, updated_at = NOW() WHERE id = ?',
    [data.rating, data.feedback, consultationId]
  )
}

async function transferConsultation(consultationId, targetStaffId, reason) {
  const db = database.getInstance()
  await db.query(
    'UPDATE consultations SET staff_id = ?, transfer_reason = ?, updated_at = NOW() WHERE id = ?',
    [targetStaffId, reason, consultationId]
  )
}

module.exports = router