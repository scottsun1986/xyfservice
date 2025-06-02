const express = require('express')
const database = require('../../config/database')
const logger = require('../utils/logger')
const { validateUserUpdate } = require('../validators/userValidator')

const router = express.Router()

/**
 * 获取用户信息
 * GET /api/user/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await getUserById(userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        country: user.country,
        province: user.province,
        city: user.city,
        created_at: user.created_at
      }
    })
  } catch (error) {
    logger.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 更新用户信息
 * PUT /api/user/profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { error } = validateUserUpdate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const userId = req.user.userId
    const { nickname, avatar, gender, country, province, city } = req.body

    await updateUser(userId, {
      nickname,
      avatar,
      gender,
      country,
      province,
      city
    })

    res.json({
      success: true,
      message: '用户信息更新成功'
    })
  } catch (error) {
    logger.error('更新用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取用户咨询历史
 * GET /api/user/consultations
 */
router.get('/consultations', async (req, res) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20, status } = req.query
    
    const offset = (page - 1) * limit
    const consultations = await getUserConsultations(userId, {
      offset,
      limit: parseInt(limit),
      status
    })

    const total = await getUserConsultationsCount(userId, status)

    res.json({
      success: true,
      data: {
        consultations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取咨询历史错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取咨询详情
 * GET /api/user/consultations/:id
 */
router.get('/consultations/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询记录不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此咨询记录'
      })
    }

    // 获取消息记录
    const messages = await getConsultationMessages(consultationId)

    res.json({
      success: true,
      data: {
        consultation,
        messages
      }
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
 * 删除咨询记录
 * DELETE /api/user/consultations/:id
 */
router.delete('/consultations/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const consultationId = req.params.id
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询记录不存在'
      })
    }

    // 检查权限
    if (consultation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此咨询记录'
      })
    }

    await deleteConsultation(consultationId)

    res.json({
      success: true,
      message: '咨询记录删除成功'
    })
  } catch (error) {
    logger.error('删除咨询记录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取用户统计信息
 * GET /api/user/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId
    
    const stats = await getUserStats(userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取用户统计错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 数据库操作函数
async function getUserById(userId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  )
  return rows[0] || null
}

async function updateUser(userId, userData) {
  const db = database.getInstance()
  const fields = []
  const values = []
  
  Object.keys(userData).forEach(key => {
    if (userData[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(userData[key])
    }
  })
  
  if (fields.length > 0) {
    fields.push('updated_at = NOW()')
    values.push(userId)
    
    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
  }
}

async function getUserConsultations(userId, options = {}) {
  const db = database.getInstance()
  let sql = `
    SELECT c.*, s.name as staff_name, s.avatar as staff_avatar
    FROM consultations c
    LEFT JOIN staff s ON c.staff_id = s.id
    WHERE c.user_id = ? AND c.deleted_at IS NULL
  `
  const params = [userId]
  
  if (options.status) {
    sql += ' AND c.status = ?'
    params.push(options.status)
  }
  
  sql += ' ORDER BY c.created_at DESC'
  
  if (options.limit) {
    sql += ' LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset || 0)
  }
  
  const { rows } = await db.query(sql, params)
  return rows
}

async function getUserConsultationsCount(userId, status) {
  const db = database.getInstance()
  let sql = 'SELECT COUNT(*) as count FROM consultations WHERE user_id = ? AND deleted_at IS NULL'
  const params = [userId]
  
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  
  const { rows } = await db.query(sql, params)
  return rows[0].count
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

async function getConsultationMessages(consultationId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT m.*, u.nickname as user_nickname, u.avatar as user_avatar,
            s.name as staff_name, s.avatar as staff_avatar
     FROM messages m
     LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
     LEFT JOIN staff s ON m.sender_type = 'staff' AND m.sender_id = s.id
     WHERE m.consultation_id = ? AND m.deleted_at IS NULL
     ORDER BY m.created_at ASC`,
    [consultationId]
  )
  return rows
}

async function deleteConsultation(consultationId) {
  const db = database.getInstance()
  await db.query(
    'UPDATE consultations SET deleted_at = NOW() WHERE id = ?',
    [consultationId]
  )
}

async function getUserStats(userId) {
  const db = database.getInstance()
  
  // 获取咨询总数
  const { rows: totalRows } = await db.query(
    'SELECT COUNT(*) as total FROM consultations WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  )
  
  // 获取各状态咨询数
  const { rows: statusRows } = await db.query(
    'SELECT status, COUNT(*) as count FROM consultations WHERE user_id = ? AND deleted_at IS NULL GROUP BY status',
    [userId]
  )
  
  // 获取消息总数
  const { rows: messageRows } = await db.query(
    `SELECT COUNT(*) as total FROM messages m
     JOIN consultations c ON m.consultation_id = c.id
     WHERE c.user_id = ? AND m.deleted_at IS NULL`,
    [userId]
  )
  
  const statusStats = {}
  statusRows.forEach(row => {
    statusStats[row.status] = row.count
  })
  
  return {
    totalConsultations: totalRows[0].total,
    totalMessages: messageRows[0].total,
    statusStats
  }
}

module.exports = router