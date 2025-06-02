const jwt = require('jsonwebtoken')
const config = require('../../config/config')
const database = require('../../config/database')
const redis = require('../../config/redis')
const logger = require('../utils/logger')

/**
 * 验证JWT令牌
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '缺少访问令牌'
      })
    }

    // 检查令牌是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(token)
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '令牌已失效'
      })
    }

    // 验证令牌
    const decoded = jwt.verify(token, config.jwt.secret)
    
    // 检查令牌是否过期
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      })
    }

    // 验证用户是否存在且状态正常
    const user = await validateUser(decoded)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      })
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: decoded.userId,
      userType: decoded.userType,
      username: decoded.username,
      ...user
    }
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      })
    }
    
    logger.error('令牌验证错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

/**
 * 验证用户权限（仅用户）
 */
const requireUser = (req, res, next) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({
      success: false,
      message: '需要用户权限'
    })
  }
  next()
}

/**
 * 验证客服权限（仅客服）
 */
const requireStaff = (req, res, next) => {
  if (req.user.userType !== 'staff') {
    return res.status(403).json({
      success: false,
      message: '需要客服权限'
    })
  }
  next()
}

/**
 * 验证管理员权限（仅管理员）
 */
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    })
  }
  next()
}

/**
 * 验证超级管理员权限
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin' || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '需要超级管理员权限'
    })
  }
  next()
}

/**
 * 验证客服或管理员权限
 */
const requireStaffOrAdmin = (req, res, next) => {
  if (!['staff', 'admin'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: '需要客服或管理员权限'
    })
  }
  next()
}

/**
 * 可选的令牌验证（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req)
    
    if (token) {
      const isBlacklisted = await isTokenBlacklisted(token)
      if (!isBlacklisted) {
        const decoded = jwt.verify(token, config.jwt.secret)
        
        if (decoded.exp >= Date.now() / 1000) {
          const user = await validateUser(decoded)
          if (user) {
            req.user = {
              userId: decoded.userId,
              userType: decoded.userType,
              username: decoded.username,
              ...user
            }
          }
        }
      }
    }
    
    next()
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next()
  }
}

/**
 * 从请求中提取令牌
 */
function extractToken(req) {
  // 从Authorization头中提取
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // 从查询参数中提取
  if (req.query.token) {
    return req.query.token
  }
  
  // 从Cookie中提取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token
  }
  
  return null
}

/**
 * 检查令牌是否在黑名单中
 */
async function isTokenBlacklisted(token) {
  try {
    const redisClient = redis.getInstance()
    const result = await redisClient.get(`blacklist:${token}`)
    return result !== null
  } catch (error) {
    logger.warn('检查令牌黑名单失败:', error)
    return false
  }
}

/**
 * 验证用户是否存在且状态正常
 */
async function validateUser(decoded) {
  try {
    const db = database.getInstance()
    let user = null
    
    switch (decoded.userType) {
      case 'user':
        const { rows: userRows } = await db.query(
          'SELECT id, openid, nickname, avatar, phone, email FROM users WHERE id = ? AND deleted_at IS NULL',
          [decoded.userId]
        )
        user = userRows[0]
        break
        
      case 'staff':
        const { rows: staffRows } = await db.query(
          'SELECT id, username, name, email, phone, department, position, status FROM staff WHERE id = ? AND deleted_at IS NULL AND status = "active"',
          [decoded.userId]
        )
        user = staffRows[0]
        break
        
      case 'admin':
        const { rows: adminRows } = await db.query(
          'SELECT id, username, name, email, role, status FROM admins WHERE id = ? AND deleted_at IS NULL AND status = "active"',
          [decoded.userId]
        )
        user = adminRows[0]
        break
    }
    
    return user
  } catch (error) {
    logger.error('验证用户失败:', error)
    return null
  }
}

/**
 * 将令牌加入黑名单
 */
async function blacklistToken(token, expiresIn = 3600) {
  try {
    const redisClient = redis.getInstance()
    await redisClient.setex(`blacklist:${token}`, expiresIn, '1')
    return true
  } catch (error) {
    logger.error('加入令牌黑名单失败:', error)
    return false
  }
}

/**
 * 生成JWT令牌
 */
function generateToken(payload, options = {}) {
  const defaultOptions = {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer
  }
  
  return jwt.sign(payload, config.jwt.secret, { ...defaultOptions, ...options })
}

/**
 * 生成刷新令牌
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer
  })
}

/**
 * 验证刷新令牌
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret)
}

/**
 * 记录用户登录
 */
async function recordLogin(userId, userType, ip, userAgent) {
  try {
    const db = database.getInstance()
    
    // 更新最后登录时间
    switch (userType) {
      case 'user':
        await db.query(
          'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
          [ip, userId]
        )
        break
        
      case 'staff':
        await db.query(
          'UPDATE staff SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
          [ip, userId]
        )
        break
        
      case 'admin':
        await db.query(
          'UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
          [ip, userId]
        )
        break
    }
    
    // 记录登录日志
    await db.query(
      `INSERT INTO login_logs (user_id, user_type, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, userType, ip, userAgent]
    )
    
  } catch (error) {
    logger.error('记录登录失败:', error)
  }
}

module.exports = {
  verifyToken,
  requireUser,
  requireStaff,
  requireAdmin,
  requireSuperAdmin,
  requireStaffOrAdmin,
  optionalAuth,
  blacklistToken,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  recordLogin
}