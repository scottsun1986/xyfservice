const logger = require('../utils/logger')
const config = require('../../config/config')

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  logger.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    userType: req.user?.userType
  })

  // 数据库连接错误
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    error = {
      message: '数据库连接失败',
      statusCode: 503
    }
  }

  // MySQL错误
  if (err.code && err.code.startsWith('ER_')) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        error = {
          message: '数据已存在',
          statusCode: 409
        }
        break
      case 'ER_NO_REFERENCED_ROW_2':
        error = {
          message: '关联数据不存在',
          statusCode: 400
        }
        break
      case 'ER_ROW_IS_REFERENCED_2':
        error = {
          message: '数据被其他记录引用，无法删除',
          statusCode: 400
        }
        break
      case 'ER_DATA_TOO_LONG':
        error = {
          message: '数据长度超出限制',
          statusCode: 400
        }
        break
      case 'ER_BAD_NULL_ERROR':
        error = {
          message: '必填字段不能为空',
          statusCode: 400
        }
        break
      default:
        error = {
          message: '数据库操作失败',
          statusCode: 500
        }
    }
  }

  // Redis错误
  if (err.code === 'ECONNREFUSED' && err.port === 6379) {
    error = {
      message: 'Redis连接失败',
      statusCode: 503
    }
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: '无效的访问令牌',
      statusCode: 401
    }
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: '访问令牌已过期',
      statusCode: 401
    }
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = {
      message: `数据验证失败: ${message}`,
      statusCode: 400
    }
  }

  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: '文件大小超出限制',
      statusCode: 400
    }
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      message: '文件数量超出限制',
      statusCode: 400
    }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: '意外的文件字段',
      statusCode: 400
    }
  }

  // 权限错误
  if (err.name === 'UnauthorizedError') {
    error = {
      message: '未授权访问',
      statusCode: 401
    }
  }

  if (err.name === 'ForbiddenError') {
    error = {
      message: '禁止访问',
      statusCode: 403
    }
  }

  // 业务逻辑错误
  if (err.name === 'BusinessError') {
    error = {
      message: err.message,
      statusCode: err.statusCode || 400
    }
  }

  // 网络错误
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
    error = {
      message: '网络连接失败',
      statusCode: 503
    }
  }

  // 语法错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      message: 'JSON格式错误',
      statusCode: 400
    }
  }

  // 默认错误
  const statusCode = error.statusCode || 500
  const message = error.message || '服务器内部错误'

  // 构建响应
  const response = {
    success: false,
    message: message,
    ...(config.env === 'development' && {
      error: {
        stack: err.stack,
        details: err
      }
    })
  }

  res.status(statusCode).json(response)
}

/**
 * 404错误处理
 */
const notFound = (req, res, next) => {
  const error = new Error(`路径 ${req.originalUrl} 不存在`)
  error.statusCode = 404
  next(error)
}

/**
 * 异步错误捕获包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * 业务错误类
 */
class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'BusinessError'
    this.statusCode = statusCode
  }
}

/**
 * 权限错误类
 */
class UnauthorizedError extends Error {
  constructor(message = '未授权访问') {
    super(message)
    this.name = 'UnauthorizedError'
    this.statusCode = 401
  }
}

/**
 * 禁止访问错误类
 */
class ForbiddenError extends Error {
  constructor(message = '禁止访问') {
    super(message)
    this.name = 'ForbiddenError'
    this.statusCode = 403
  }
}

/**
 * 资源不存在错误类
 */
class NotFoundError extends Error {
  constructor(message = '资源不存在') {
    super(message)
    this.name = 'NotFoundError'
    this.statusCode = 404
  }
}

/**
 * 验证错误类
 */
class ValidationError extends Error {
  constructor(message = '数据验证失败') {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
  }
}

/**
 * 冲突错误类
 */
class ConflictError extends Error {
  constructor(message = '数据冲突') {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
  }
}

/**
 * 服务不可用错误类
 */
class ServiceUnavailableError extends Error {
  constructor(message = '服务暂时不可用') {
    super(message)
    this.name = 'ServiceUnavailableError'
    this.statusCode = 503
  }
}

/**
 * 请求超时错误类
 */
class TimeoutError extends Error {
  constructor(message = '请求超时') {
    super(message)
    this.name = 'TimeoutError'
    this.statusCode = 408
  }
}

/**
 * 请求过于频繁错误类
 */
class TooManyRequestsError extends Error {
  constructor(message = '请求过于频繁') {
    super(message)
    this.name = 'TooManyRequestsError'
    this.statusCode = 429
  }
}

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  BusinessError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ServiceUnavailableError,
  TimeoutError,
  TooManyRequestsError
}