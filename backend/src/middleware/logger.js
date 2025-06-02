const morgan = require('morgan')
const logger = require('../utils/logger')
const config = require('../../config/config')

/**
 * 自定义日志格式
 */
const logFormat = config.env === 'production' 
  ? 'combined' 
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'

/**
 * 创建日志流
 */
const stream = {
  write: (message) => {
    // 移除换行符
    const cleanMessage = message.trim()
    
    // 解析日志信息
    const logData = parseLogMessage(cleanMessage)
    
    // 根据状态码决定日志级别
    if (logData.status >= 500) {
      logger.error('HTTP请求错误', logData)
    } else if (logData.status >= 400) {
      logger.warn('HTTP请求警告', logData)
    } else {
      logger.info('HTTP请求', logData)
    }
  }
}

/**
 * 解析日志消息
 */
function parseLogMessage(message) {
  // 简单的日志解析，实际项目中可能需要更复杂的解析逻辑
  const parts = message.split(' ')
  
  return {
    ip: parts[0] || '-',
    method: extractFromQuotes(message, 'method') || '-',
    url: extractFromQuotes(message, 'url') || '-',
    status: parseInt(parts.find(part => /^[1-5]\d{2}$/.test(part))) || 0,
    responseTime: extractResponseTime(message) || 0,
    userAgent: extractUserAgent(message) || '-',
    timestamp: new Date().toISOString()
  }
}

/**
 * 从引号中提取信息
 */
function extractFromQuotes(message, type) {
  const regex = /"([^"]*)"/g
  const matches = []
  let match
  
  while ((match = regex.exec(message)) !== null) {
    matches.push(match[1])
  }
  
  if (type === 'method' && matches[0]) {
    return matches[0].split(' ')[0]
  }
  
  if (type === 'url' && matches[0]) {
    return matches[0].split(' ')[1]
  }
  
  return null
}

/**
 * 提取响应时间
 */
function extractResponseTime(message) {
  const match = message.match(/(\d+(?:\.\d+)?)\s*ms/)
  return match ? parseFloat(match[1]) : null
}

/**
 * 提取User-Agent
 */
function extractUserAgent(message) {
  const matches = message.match(/"([^"]*)"/g)
  return matches && matches.length >= 2 ? matches[matches.length - 1].slice(1, -1) : null
}

/**
 * 跳过某些请求的日志记录
 */
const skip = (req, res) => {
  // 跳过健康检查请求
  if (req.url === '/health' || req.url === '/ping') {
    return true
  }
  
  // 跳过静态资源请求（在生产环境中）
  if (config.env === 'production' && req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    return true
  }
  
  // 跳过成功的OPTIONS请求
  if (req.method === 'OPTIONS' && res.statusCode < 400) {
    return true
  }
  
  return false
}

/**
 * 自定义token
 */
morgan.token('user-id', (req) => {
  return req.user ? req.user.userId : '-'
})

morgan.token('user-type', (req) => {
  return req.user ? req.user.userType : '-'
})

morgan.token('request-id', (req) => {
  return req.requestId || '-'
})

morgan.token('real-ip', (req) => {
  return req.headers['x-real-ip'] || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip
})

/**
 * 详细日志格式（用于开发环境）
 */
const detailedFormat = [
  ':real-ip',
  ':user-id',
  ':user-type', 
  ':request-id',
  '[:date[clf]]',
  '":method :url HTTP/:http-version"',
  ':status',
  ':res[content-length]',
  '":referrer"',
  '":user-agent"',
  ':response-time ms'
].join(' ')

/**
 * 创建HTTP日志中间件
 */
const httpLogger = morgan(
  config.env === 'development' ? detailedFormat : logFormat,
  {
    stream,
    skip
  }
)

/**
 * 请求ID中间件
 */
const requestId = (req, res, next) => {
  req.requestId = generateRequestId()
  res.setHeader('X-Request-ID', req.requestId)
  next()
}

/**
 * 生成请求ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * 请求开始时间中间件
 */
const requestTimer = (req, res, next) => {
  req.startTime = Date.now()
  next()
}

/**
 * 响应时间记录中间件
 */
const responseTime = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // 记录慢请求
    if (duration > 1000) {
      logger.warn('慢请求检测', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        requestId: req.requestId
      })
    }
  })
  
  next()
}

/**
 * 错误请求记录中间件
 */
const errorLogger = (err, req, res, next) => {
  logger.error('请求处理错误', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      requestId: req.requestId
    }
  })
  
  next(err)
}

module.exports = {
  httpLogger,
  requestId,
  requestTimer,
  responseTime,
  errorLogger
}