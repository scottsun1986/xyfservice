const winston = require('winston')
const path = require('path')
const fs = require('fs')
const config = require('../../config/config')

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// 控制台输出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    
    if (Object.keys(meta).length > 0) {
      msg += '\n' + JSON.stringify(meta, null, 2)
    }
    
    return msg
  })
)

// 创建传输器
const transports = []

// 控制台输出
if (config.env === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  )
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.simple(),
      level: 'info'
    })
  )
}

// 文件输出
transports.push(
  // 错误日志
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // 组合日志
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // 访问日志
  new winston.transports.File({
    filename: path.join(logDir, 'access.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  })
)

// 创建logger实例
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'xyfservice-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env
  },
  transports,
  exitOnError: false
})

// 处理未捕获的异常
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: logFormat
  })
)

// 处理未处理的Promise拒绝
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    format: logFormat
  })
)

// 扩展logger功能
class Logger {
  constructor(winstonLogger) {
    this.winston = winstonLogger
  }

  // 基础日志方法
  error(message, meta = {}) {
    this.winston.error(message, meta)
  }

  warn(message, meta = {}) {
    this.winston.warn(message, meta)
  }

  info(message, meta = {}) {
    this.winston.info(message, meta)
  }

  debug(message, meta = {}) {
    this.winston.debug(message, meta)
  }

  verbose(message, meta = {}) {
    this.winston.verbose(message, meta)
  }

  // 业务日志方法
  auth(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'auth' })
  }

  api(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'api' })
  }

  database(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'database' })
  }

  websocket(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'websocket' })
  }

  upload(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'upload' })
  }

  security(message, meta = {}) {
    this.winston.warn(message, { ...meta, category: 'security' })
  }

  performance(message, meta = {}) {
    this.winston.info(message, { ...meta, category: 'performance' })
  }

  // 用户操作日志
  userAction(userId, action, details = {}) {
    this.winston.info('用户操作', {
      userId,
      action,
      details,
      category: 'user_action',
      timestamp: new Date().toISOString()
    })
  }

  // 系统事件日志
  systemEvent(event, details = {}) {
    this.winston.info('系统事件', {
      event,
      details,
      category: 'system_event',
      timestamp: new Date().toISOString()
    })
  }

  // 安全事件日志
  securityEvent(event, details = {}) {
    this.winston.warn('安全事件', {
      event,
      details,
      category: 'security_event',
      timestamp: new Date().toISOString()
    })
  }

  // 业务错误日志
  businessError(error, context = {}) {
    this.winston.error('业务错误', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      category: 'business_error',
      timestamp: new Date().toISOString()
    })
  }

  // 技术错误日志
  technicalError(error, context = {}) {
    this.winston.error('技术错误', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      category: 'technical_error',
      timestamp: new Date().toISOString()
    })
  }

  // 性能监控日志
  performanceMetric(metric, value, unit = 'ms', context = {}) {
    this.winston.info('性能指标', {
      metric,
      value,
      unit,
      context,
      category: 'performance_metric',
      timestamp: new Date().toISOString()
    })
  }

  // 审计日志
  audit(action, actor, target, details = {}) {
    this.winston.info('审计日志', {
      action,
      actor,
      target,
      details,
      category: 'audit',
      timestamp: new Date().toISOString()
    })
  }

  // 创建子logger
  child(defaultMeta) {
    const childLogger = this.winston.child(defaultMeta)
    return new Logger(childLogger)
  }

  // 临时改变日志级别
  withLevel(level) {
    const tempLogger = winston.createLogger({
      level: level,
      format: this.winston.format,
      transports: this.winston.transports
    })
    return new Logger(tempLogger)
  }

  // 获取日志统计
  getStats() {
    return {
      level: this.winston.level,
      transports: this.winston.transports.length,
      logDir: logDir
    }
  }
}

// 创建并导出logger实例
const loggerInstance = new Logger(logger)

// 监听进程事件
process.on('uncaughtException', (error) => {
  loggerInstance.error('未捕获的异常', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    category: 'uncaught_exception'
  })
})

process.on('unhandledRejection', (reason, promise) => {
  loggerInstance.error('未处理的Promise拒绝', {
    reason: reason,
    promise: promise,
    category: 'unhandled_rejection'
  })
})

// 优雅关闭时清理日志
process.on('SIGINT', () => {
  loggerInstance.info('收到SIGINT信号，正在关闭日志系统')
  logger.end()
})

process.on('SIGTERM', () => {
  loggerInstance.info('收到SIGTERM信号，正在关闭日志系统')
  logger.end()
})

module.exports = loggerInstance