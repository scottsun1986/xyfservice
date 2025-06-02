const express = require('express')
const database = require('../../config/database')
const logger = require('../utils/logger')
const authMiddleware = require('../middleware/auth')
const { validateStaffUpdate } = require('../validators/staffValidator')

const router = express.Router()

/**
 * 获取在线客服数量
 * GET /api/staff/online-count
 */
router.get('/online-count', async (req, res) => {
  try {
    const count = await getOnlineStaffCount()
    
    res.json({
      success: true,
      data: {
        count
      }
    })
  } catch (error) {
    logger.error('获取在线客服数量错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取可用客服列表
 * GET /api/staff/available
 */
router.get('/available', async (req, res) => {
  try {
    const staff = await getAvailableStaff()
    
    res.json({
      success: true,
      data: staff
    })
  } catch (error) {
    logger.error('获取可用客服列表错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取客服信息（需要认证）
 * GET /api/staff/profile
 */
router.get('/profile', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const staffId = req.user.staffId
    const staff = await getStaffById(staffId)
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      })
    }

    res.json({
      success: true,
      data: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        avatar: staff.avatar,
        email: staff.email,
        phone: staff.phone,
        department: staff.department,
        role: staff.role,
        status: staff.status,
        created_at: staff.created_at
      }
    })
  } catch (error) {
    logger.error('获取客服信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 更新客服信息
 * PUT /api/staff/profile
 */
router.put('/profile', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const { error } = validateStaffUpdate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const staffId = req.user.staffId
    const { name, avatar, email, phone, signature } = req.body

    await updateStaff(staffId, {
      name,
      avatar,
      email,
      phone,
      signature
    })

    res.json({
      success: true,
      message: '客服信息更新成功'
    })
  } catch (error) {
    logger.error('更新客服信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 更新客服状态
 * PUT /api/staff/status
 */
router.put('/status', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['online', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      })
    }

    const staffId = req.user.staffId
    await updateStaffStatus(staffId, status)

    res.json({
      success: true,
      message: '状态更新成功'
    })
  } catch (error) {
    logger.error('更新客服状态错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取客服咨询列表
 * GET /api/staff/consultations
 */
router.get('/consultations', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const staffId = req.user.staffId
    const { page = 1, limit = 20, status } = req.query
    
    const offset = (page - 1) * limit
    const consultations = await getStaffConsultations(staffId, {
      offset,
      limit: parseInt(limit),
      status
    })

    const total = await getStaffConsultationsCount(staffId, status)

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
    logger.error('获取客服咨询列表错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取客服统计信息
 * GET /api/staff/stats
 */
router.get('/stats', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const staffId = req.user.staffId
    const { startDate, endDate } = req.query
    
    const stats = await getStaffStats(staffId, { startDate, endDate })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取客服统计错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 接受咨询
 * POST /api/staff/consultations/:id/accept
 */
router.post('/consultations/:id/accept', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const staffId = req.user.staffId
    const consultationId = req.params.id
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    if (consultation.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '咨询状态不允许接受'
      })
    }

    await acceptConsultation(consultationId, staffId)

    res.json({
      success: true,
      message: '咨询接受成功'
    })
  } catch (error) {
    logger.error('接受咨询错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 结束咨询
 * POST /api/staff/consultations/:id/close
 */
router.post('/consultations/:id/close', authMiddleware.verifyStaff, async (req, res) => {
  try {
    const staffId = req.user.staffId
    const consultationId = req.params.id
    const { reason } = req.body
    
    const consultation = await getConsultationById(consultationId)
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      })
    }

    if (consultation.staff_id !== staffId) {
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

    await closeConsultation(consultationId, reason)

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

// 数据库操作函数
async function getOnlineStaffCount() {
  const db = database.getInstance()
  const { rows } = await db.query(
    "SELECT COUNT(*) as count FROM staff WHERE status = 'online' AND deleted_at IS NULL"
  )
  return rows[0].count
}

async function getAvailableStaff() {
  const db = database.getInstance()
  const { rows } = await db.query(
    `SELECT id, name, avatar, department, status
     FROM staff 
     WHERE status IN ('online', 'busy') AND deleted_at IS NULL
     ORDER BY status = 'online' DESC, name ASC`
  )
  return rows
}

async function getStaffById(staffId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL',
    [staffId]
  )
  return rows[0] || null
}

async function updateStaff(staffId, staffData) {
  const db = database.getInstance()
  const fields = []
  const values = []
  
  Object.keys(staffData).forEach(key => {
    if (staffData[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(staffData[key])
    }
  })
  
  if (fields.length > 0) {
    fields.push('updated_at = NOW()')
    values.push(staffId)
    
    await db.query(
      `UPDATE staff SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
  }
}

async function updateStaffStatus(staffId, status) {
  const db = database.getInstance()
  await db.query(
    'UPDATE staff SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, staffId]
  )
}

async function getStaffConsultations(staffId, options = {}) {
  const db = database.getInstance()
  let sql = `
    SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
    FROM consultations c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.staff_id = ? AND c.deleted_at IS NULL
  `
  const params = [staffId]
  
  if (options.status) {
    sql += ' AND c.status = ?'
    params.push(options.status)
  }
  
  sql += ' ORDER BY c.updated_at DESC'
  
  if (options.limit) {
    sql += ' LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset || 0)
  }
  
  const { rows } = await db.query(sql, params)
  return rows
}

async function getStaffConsultationsCount(staffId, status) {
  const db = database.getInstance()
  let sql = 'SELECT COUNT(*) as count FROM consultations WHERE staff_id = ? AND deleted_at IS NULL'
  const params = [staffId]
  
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  
  const { rows } = await db.query(sql, params)
  return rows[0].count
}

async function getStaffStats(staffId, options = {}) {
  const db = database.getInstance()
  let dateCondition = ''
  const params = [staffId]
  
  if (options.startDate && options.endDate) {
    dateCondition = ' AND c.created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }
  
  // 获取咨询总数
  const { rows: totalRows } = await db.query(
    `SELECT COUNT(*) as total FROM consultations c WHERE c.staff_id = ? AND c.deleted_at IS NULL${dateCondition}`,
    params
  )
  
  // 获取各状态咨询数
  const { rows: statusRows } = await db.query(
    `SELECT status, COUNT(*) as count FROM consultations c WHERE c.staff_id = ? AND c.deleted_at IS NULL${dateCondition} GROUP BY status`,
    params
  )
  
  // 获取消息总数
  const { rows: messageRows } = await db.query(
    `SELECT COUNT(*) as total FROM messages m
     JOIN consultations c ON m.consultation_id = c.id
     WHERE c.staff_id = ? AND m.sender_type = 'staff' AND m.deleted_at IS NULL${dateCondition}`,
    params
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

async function getConsultationById(consultationId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM consultations WHERE id = ? AND deleted_at IS NULL',
    [consultationId]
  )
  return rows[0] || null
}

async function acceptConsultation(consultationId, staffId) {
  const db = database.getInstance()
  await db.query(
    "UPDATE consultations SET staff_id = ?, status = 'active', accepted_at = NOW(), updated_at = NOW() WHERE id = ?",
    [staffId, consultationId]
  )
}

async function closeConsultation(consultationId, reason) {
  const db = database.getInstance()
  await db.query(
    "UPDATE consultations SET status = 'closed', close_reason = ?, closed_at = NOW(), updated_at = NOW() WHERE id = ?",
    [reason, consultationId]
  )
}

module.exports = router