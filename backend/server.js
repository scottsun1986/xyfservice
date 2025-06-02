const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')

// 导入配置
const config = require('./config/config')
const database = require('./config/database')
const redis = require('./config/redis')

// 导入路由
const authRoutes = require('./src/routes/auth')
const userRoutes = require('./src/routes/user')
const staffRoutes = require('./src/routes/staff')
const consultationRoutes = require('./src/routes/consultation')
const messageRoutes = require('./src/routes/message')
const uploadRoutes = require('./src/routes/upload')
const systemRoutes = require('./src/routes/system')
const adminRoutes = require('./src/routes/admin')

// 导入中间件
const authMiddleware = require('./src/middleware/auth')
const errorHandler = require('./src/middleware/errorHandler')
const logger = require('./src/utils/logger')

// 导入Socket处理器
const socketHandler = require('./src/services/socketService')

// 创建Express应用
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  }
}))

app.use(compression())
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// 请求解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/public', express.static(path.join(__dirname, 'public')))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/user', authMiddleware.verifyUser, userRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/consultation', authMiddleware.verifyUser, consultationRoutes)
app.use('/api/message', authMiddleware.verifyUser, messageRoutes)
app.use('/api/upload', authMiddleware.verifyUser, uploadRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/admin', authMiddleware.verifyAdmin, adminRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API文档
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '微信小程序客服系统 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      staff: '/api/staff',
      consultation: '/api/consultation',
      message: '/api/message',
      upload: '/api/upload',
      system: '/api/system',
      admin: '/api/admin'
    },
    websocket: {
      url: config.websocket.url,
      events: ['connect', 'disconnect', 'message', 'messageStatus', 'staffStatus', 'userTyping', 'staffTyping']
    }
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  })
})

// 错误处理中间件
app.use(errorHandler)

// Socket.IO处理
socketHandler(io)

// 优雅关闭
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

function gracefulShutdown(signal) {
  logger.info(`收到 ${signal} 信号，开始优雅关闭...`)
  
  server.close(() => {
    logger.info('HTTP服务器已关闭')
    
    // 关闭数据库连接
    database.close().then(() => {
      logger.info('数据库连接已关闭')
    }).catch(err => {
      logger.error('关闭数据库连接失败:', err)
    })
    
    // 关闭Redis连接
    redis.quit().then(() => {
      logger.info('Redis连接已关闭')
    }).catch(err => {
      logger.error('关闭Redis连接失败:', err)
    })
    
    process.exit(0)
  })
  
  // 强制关闭
  setTimeout(() => {
    logger.error('强制关闭服务器')
    process.exit(1)
  }, 10000)
}

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason)
  logger.error('Promise:', promise)
  process.exit(1)
})

// 启动服务器
const PORT = config.server.port || 3000
const HOST = config.server.host || '0.0.0.0'

server.listen(PORT, HOST, () => {
  logger.info(`服务器启动成功`)
  logger.info(`HTTP服务: http://${HOST}:${PORT}`)
  logger.info(`WebSocket服务: ws://${HOST}:${PORT}`)
  logger.info(`环境: ${config.env}`)
  logger.info(`数据库: ${config.database.host}:${config.database.port}/${config.database.database}`)
  logger.info(`Redis: ${config.redis.host}:${config.redis.port}`)
  
  // 创建必要的目录
  const uploadDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    logger.info('创建上传目录:', uploadDir)
  }
  
  const logDir = path.join(__dirname, 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
    logger.info('创建日志目录:', logDir)
  }
})

// 导出app用于测试
module.exports = { app, server, io }