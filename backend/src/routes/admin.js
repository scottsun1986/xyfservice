const express = require('express')
const bcrypt = require('bcryptjs')
const database = require('../../config/database')
const logger = require('../utils/logger')
const { validateAdminCreate, validateAdminUpdate, validateStaffCreate, validateStaffUpdate } = require('../validators/adminValidator')

const router = express.Router()

/**
 * 获取管理员列表
 * GET /api/admin/admins
 */
router.get('/admins', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query
    const offset = (page - 1) * limit
    
    let sql = `
      SELECT id, username, email, name, role, status, last_login_at, created_at, updated_at
      FROM admins 
      WHERE deleted_at IS NULL
    `
    const params = []
    
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    if (keyword) {
      sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const db = database.getInstance()
    const { rows } = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM admins WHERE deleted_at IS NULL'
    const countParams = []
    
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    
    if (keyword) {
      countSql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const { rows: countRows } = await db.query(countSql, countParams)
    const total = countRows[0].total
    
    res.json({
      success: true,
      data: {
        admins: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取管理员列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取管理员列表失败'
    })
  }
})

/**
 * 创建管理员
 * POST /api/admin/admins
 */
router.post('/admins', async (req, res) => {
  try {
    const { error } = validateAdminCreate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { username, password, email, name, role = 'admin' } = req.body
    
    // 检查用户名是否已存在
    const existingAdmin = await getAdminByUsername(username)
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await getAdminByEmail(email)
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已存在'
      })
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const adminId = await createAdmin({
      username,
      password: hashedPassword,
      email,
      name,
      role
    })
    
    logger.info('管理员创建成功:', {
      createdBy: req.user.userId,
      adminId,
      username,
      role
    })
    
    res.json({
      success: true,
      message: '管理员创建成功',
      data: { adminId }
    })
  } catch (error) {
    logger.error('创建管理员错误:', error)
    res.status(500).json({
      success: false,
      message: '创建管理员失败'
    })
  }
})

/**
 * 更新管理员
 * PUT /api/admin/admins/:id
 */
router.put('/admins/:id', async (req, res) => {
  try {
    const { error } = validateAdminUpdate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const adminId = req.params.id
    const { email, name, role, status, password } = req.body
    
    const admin = await getAdminById(adminId)
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    const updateData = { email, name, role, status }
    
    // 如果提供了新密码，加密后更新
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    await updateAdmin(adminId, updateData)
    
    logger.info('管理员更新成功:', {
      updatedBy: req.user.userId,
      adminId,
      updateData: { email, name, role, status }
    })
    
    res.json({
      success: true,
      message: '管理员更新成功'
    })
  } catch (error) {
    logger.error('更新管理员错误:', error)
    res.status(500).json({
      success: false,
      message: '更新管理员失败'
    })
  }
})

/**
 * 删除管理员
 * DELETE /api/admin/admins/:id
 */
router.delete('/admins/:id', async (req, res) => {
  try {
    const adminId = req.params.id
    
    // 不能删除自己
    if (adminId == req.user.userId) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      })
    }
    
    const admin = await getAdminById(adminId)
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    await deleteAdmin(adminId)
    
    logger.info('管理员删除成功:', {
      deletedBy: req.user.userId,
      adminId,
      username: admin.username
    })
    
    res.json({
      success: true,
      message: '管理员删除成功'
    })
  } catch (error) {
    logger.error('删除管理员错误:', error)
    res.status(500).json({
      success: false,
      message: '删除管理员失败'
    })
  }
})

/**
 * 获取客服列表
 * GET /api/admin/staff
 */
router.get('/staff', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, keyword } = req.query
    const offset = (page - 1) * limit
    
    let sql = `
      SELECT id, username, name, email, phone, department, position, status, 
             avatar, last_login_at, created_at, updated_at
      FROM staff 
      WHERE deleted_at IS NULL
    `
    const params = []
    
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    if (department) {
      sql += ' AND department = ?'
      params.push(department)
    }
    
    if (keyword) {
      sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const db = database.getInstance()
    const { rows } = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM staff WHERE deleted_at IS NULL'
    const countParams = []
    
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    
    if (department) {
      countSql += ' AND department = ?'
      countParams.push(department)
    }
    
    if (keyword) {
      countSql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const { rows: countRows } = await db.query(countSql, countParams)
    const total = countRows[0].total
    
    res.json({
      success: true,
      data: {
        staff: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取客服列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取客服列表失败'
    })
  }
})

/**
 * 创建客服
 * POST /api/admin/staff
 */
router.post('/staff', async (req, res) => {
  try {
    const { error } = validateStaffCreate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { username, password, name, email, phone, department, position } = req.body
    
    // 检查用户名是否已存在
    const existingStaff = await getStaffByUsername(username)
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await getStaffByEmail(email)
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const staffId = await createStaff({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      department,
      position
    })
    
    logger.info('客服创建成功:', {
      createdBy: req.user.userId,
      staffId,
      username,
      department
    })
    
    res.json({
      success: true,
      message: '客服创建成功',
      data: { staffId }
    })
  } catch (error) {
    logger.error('创建客服错误:', error)
    res.status(500).json({
      success: false,
      message: '创建客服失败'
    })
  }
})

/**
 * 更新客服
 * PUT /api/admin/staff/:id
 */
router.put('/staff/:id', async (req, res) => {
  try {
    const { error } = validateStaffUpdate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const staffId = req.params.id
    const { name, email, phone, department, position, status, password } = req.body
    
    const staff = await getStaffById(staffId)
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      })
    }
    
    const updateData = { name, email, phone, department, position, status }
    
    // 如果提供了新密码，加密后更新
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    await updateStaff(staffId, updateData)
    
    logger.info('客服更新成功:', {
      updatedBy: req.user.userId,
      staffId,
      updateData: { name, email, phone, department, position, status }
    })
    
    res.json({
      success: true,
      message: '客服更新成功'
    })
  } catch (error) {
    logger.error('更新客服错误:', error)
    res.status(500).json({
      success: false,
      message: '更新客服失败'
    })
  }
})

/**
 * 删除客服
 * DELETE /api/admin/staff/:id
 */
router.delete('/staff/:id', async (req, res) => {
  try {
    const staffId = req.params.id
    
    const staff = await getStaffById(staffId)
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      })
    }
    
    // 检查是否有进行中的咨询
    const activeConsultations = await getStaffActiveConsultations(staffId)
    if (activeConsultations > 0) {
      return res.status(400).json({
        success: false,
        message: '该客服还有进行中的咨询，无法删除'
      })
    }
    
    await deleteStaff(staffId)
    
    logger.info('客服删除成功:', {
      deletedBy: req.user.userId,
      staffId,
      username: staff.username
    })
    
    res.json({
      success: true,
      message: '客服删除成功'
    })
  } catch (error) {
    logger.error('删除客服错误:', error)
    res.status(500).json({
      success: false,
      message: '删除客服失败'
    })
  }
})

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query
    const offset = (page - 1) * limit
    
    let sql = `
      SELECT id, openid, nickname, avatar, phone, email, gender, 
             last_login_at, created_at, updated_at
      FROM users 
      WHERE deleted_at IS NULL
    `
    const params = []
    
    if (keyword) {
      sql += ' AND (nickname LIKE ? OR phone LIKE ? OR email LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const db = database.getInstance()
    const { rows } = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'
    const countParams = []
    
    if (keyword) {
      countSql += ' AND (nickname LIKE ? OR phone LIKE ? OR email LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    const { rows: countRows } = await db.query(countSql, countParams)
    const total = countRows[0].total
    
    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取用户列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    })
  }
})

/**
 * 获取咨询列表
 * GET /api/admin/consultations
 */
router.get('/consultations', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, staffId, userId, startDate, endDate } = req.query
    const offset = (page - 1) * limit
    
    let sql = `
      SELECT c.*, u.nickname as user_nickname, s.name as staff_name
      FROM consultations c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN staff s ON c.staff_id = s.id
      WHERE c.deleted_at IS NULL
    `
    const params = []
    
    if (status) {
      sql += ' AND c.status = ?'
      params.push(status)
    }
    
    if (staffId) {
      sql += ' AND c.staff_id = ?'
      params.push(staffId)
    }
    
    if (userId) {
      sql += ' AND c.user_id = ?'
      params.push(userId)
    }
    
    if (startDate && endDate) {
      sql += ' AND c.created_at BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }
    
    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const db = database.getInstance()
    const { rows } = await db.query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM consultations c WHERE c.deleted_at IS NULL'
    const countParams = []
    
    if (status) {
      countSql += ' AND c.status = ?'
      countParams.push(status)
    }
    
    if (staffId) {
      countSql += ' AND c.staff_id = ?'
      countParams.push(staffId)
    }
    
    if (userId) {
      countSql += ' AND c.user_id = ?'
      countParams.push(userId)
    }
    
    if (startDate && endDate) {
      countSql += ' AND c.created_at BETWEEN ? AND ?'
      countParams.push(startDate, endDate)
    }
    
    const { rows: countRows } = await db.query(countSql, countParams)
    const total = countRows[0].total
    
    res.json({
      success: true,
      data: {
        consultations: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取咨询列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取咨询列表失败'
    })
  }
})

// 数据库操作函数
async function getAdminByUsername(username) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM admins WHERE username = ? AND deleted_at IS NULL',
    [username]
  )
  return rows[0] || null
}

async function getAdminByEmail(email) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM admins WHERE email = ? AND deleted_at IS NULL',
    [email]
  )
  return rows[0] || null
}

async function getAdminById(id) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM admins WHERE id = ? AND deleted_at IS NULL',
    [id]
  )
  return rows[0] || null
}

async function createAdmin(data) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `INSERT INTO admins (username, password, email, name, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [data.username, data.password, data.email, data.name, data.role]
  )
  return rows.insertId
}

async function updateAdmin(id, data) {
  const db = database.getInstance()
  const fields = []
  const values = []
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  })
  
  if (fields.length === 0) return
  
  fields.push('updated_at = NOW()')
  values.push(id)
  
  await db.query(
    `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

async function deleteAdmin(id) {
  const db = database.getInstance()
  await db.query(
    'UPDATE admins SET deleted_at = NOW() WHERE id = ?',
    [id]
  )
}

async function getStaffByUsername(username) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE username = ? AND deleted_at IS NULL',
    [username]
  )
  return rows[0] || null
}

async function getStaffByEmail(email) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE email = ? AND deleted_at IS NULL',
    [email]
  )
  return rows[0] || null
}

async function getStaffById(id) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL',
    [id]
  )
  return rows[0] || null
}

async function createStaff(data) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `INSERT INTO staff (username, password, name, email, phone, department, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [data.username, data.password, data.name, data.email, data.phone, data.department, data.position]
  )
  return rows.insertId
}

async function updateStaff(id, data) {
  const db = database.getInstance()
  const fields = []
  const values = []
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  })
  
  if (fields.length === 0) return
  
  fields.push('updated_at = NOW()')
  values.push(id)
  
  await db.query(
    `UPDATE staff SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

async function deleteStaff(id) {
  const db = database.getInstance()
  await db.query(
    'UPDATE staff SET deleted_at = NOW() WHERE id = ?',
    [id]
  )
}

async function getStaffActiveConsultations(staffId) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT COUNT(*) as count FROM consultations WHERE staff_id = ? AND status IN ("waiting", "active") AND deleted_at IS NULL',
    [staffId]
  )
  return rows[0].count
}

module.exports = router