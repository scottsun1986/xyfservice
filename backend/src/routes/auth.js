const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const config = require('../../config/config')
const database = require('../../config/database')
const logger = require('../utils/logger')
const { validateLogin, validateRegister } = require('../validators/authValidator')

const router = express.Router()

/**
 * 微信小程序登录
 * POST /api/auth/wechat-login
 */
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少微信授权码'
      })
    }

    // 调用微信API获取openid和session_key
    const wechatResponse = await axios.get(config.wechat.apiUrl.code2Session, {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const { openid, session_key, errcode, errmsg } = wechatResponse.data

    if (errcode) {
      logger.error('微信登录失败:', { errcode, errmsg })
      return res.status(400).json({
        success: false,
        message: '微信登录失败: ' + errmsg
      })
    }

    // 查询或创建用户
    let user = await getUserByOpenId(openid)
    
    if (!user) {
      // 创建新用户
      user = await createUser({
        openid,
        session_key,
        nickname: userInfo?.nickName || '微信用户',
        avatar: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        country: userInfo?.country || '',
        province: userInfo?.province || '',
        city: userInfo?.city || ''
      })
    } else {
      // 更新用户信息
      await updateUser(user.id, {
        session_key,
        nickname: userInfo?.nickName || user.nickname,
        avatar: userInfo?.avatarUrl || user.avatar,
        last_login_time: new Date()
      })
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        openid: user.openid,
        type: 'user'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    })

  } catch (error) {
    logger.error('微信登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 客服登录
 * POST /api/auth/staff-login
 */
router.post('/staff-login', async (req, res) => {
  try {
    const { error } = validateLogin(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { username, password } = req.body

    // 查询客服账号
    const staff = await getStaffByUsername(username)
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, staff.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 检查账号状态
    if (staff.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      })
    }

    // 更新最后登录时间
    await updateStaffLastLogin(staff.id)

    // 生成JWT token
    const token = jwt.sign(
      { 
        staffId: staff.id, 
        username: staff.username,
        role: staff.role,
        type: 'staff'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        staff: {
          id: staff.id,
          username: staff.username,
          name: staff.name,
          avatar: staff.avatar,
          role: staff.role,
          department: staff.department
        }
      }
    })

  } catch (error) {
    logger.error('客服登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 管理员登录
 * POST /api/auth/admin-login
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { error } = validateLogin(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { username, password } = req.body

    // 查询管理员账号
    const admin = await getAdminByUsername(username)
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 检查账号状态
    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      })
    }

    // 更新最后登录时间
    await updateAdminLastLogin(admin.id)

    // 生成JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        role: admin.role,
        type: 'admin'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          avatar: admin.avatar,
          role: admin.role
        }
      }
    })

  } catch (error) {
    logger.error('管理员登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: '缺少token'
      })
    }

    // 验证token（忽略过期）
    const decoded = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true })
    
    // 生成新token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId,
        staffId: decoded.staffId,
        adminId: decoded.adminId,
        type: decoded.type
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({
      success: true,
      message: 'Token刷新成功',
      data: {
        token: newToken
      }
    })

  } catch (error) {
    logger.error('Token刷新错误:', error)
    res.status(401).json({
      success: false,
      message: 'Token无效'
    })
  }
})

/**
 * 登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    // 这里可以实现token黑名单机制
    // 目前简单返回成功
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    logger.error('登出错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 数据库操作函数
async function getUserByOpenId(openid) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM users WHERE openid = ? AND deleted_at IS NULL',
    [openid]
  )
  return rows[0] || null
}

async function createUser(userData) {
  const db = database.getInstance()
  const { rows } = await db.query(
    `INSERT INTO users (openid, session_key, nickname, avatar, gender, country, province, city, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      userData.openid,
      userData.session_key,
      userData.nickname,
      userData.avatar,
      userData.gender,
      userData.country,
      userData.province,
      userData.city
    ]
  )
  
  return {
    id: rows.insertId,
    ...userData
  }
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

async function getStaffByUsername(username) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM staff WHERE username = ? AND deleted_at IS NULL',
    [username]
  )
  return rows[0] || null
}

async function updateStaffLastLogin(staffId) {
  const db = database.getInstance()
  await db.query(
    'UPDATE staff SET last_login_time = NOW() WHERE id = ?',
    [staffId]
  )
}

async function getAdminByUsername(username) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT * FROM admins WHERE username = ? AND deleted_at IS NULL',
    [username]
  )
  return rows[0] || null
}

async function updateAdminLastLogin(adminId) {
  const db = database.getInstance()
  await db.query(
    'UPDATE admins SET last_login_time = NOW() WHERE id = ?',
    [adminId]
  )
}

module.exports = router