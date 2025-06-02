const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const config = {
  // 环境配置
  env: process.env.NODE_ENV || 'development',
  
  // 服务器配置
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT) || 3000
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'xyfservice',
    charset: 'utf8mb4',
    timezone: '+08:00',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'xyfservice:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    templateId: process.env.WECHAT_TEMPLATE_ID || '',
    apiUrl: {
      code2Session: 'https://api.weixin.qq.com/sns/jscode2session',
      accessToken: 'https://api.weixin.qq.com/cgi-bin/token',
      sendMessage: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send'
    }
  },
  
  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads'),
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      audio: ['mp3', 'wav', 'amr', 'silk'],
      video: ['mp4', 'avi', 'mov'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
    },
    imageResize: {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 800, height: 600 },
      large: { width: 1200, height: 900 }
    }
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://your-domain.com'
    ],
    credentials: true
  },
  
  // WebSocket配置
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3000',
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || path.join(__dirname, '../logs'),
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d'
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false'
    }
  },
  
  // 缓存配置
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT) || 3600, // 1小时
      user: parseInt(process.env.CACHE_TTL_USER) || 1800, // 30分钟
      staff: parseInt(process.env.CACHE_TTL_STAFF) || 1800, // 30分钟
      consultation: parseInt(process.env.CACHE_TTL_CONSULTATION) || 7200, // 2小时
      message: parseInt(process.env.CACHE_TTL_MESSAGE) || 300 // 5分钟
    }
  },
  
  // 业务配置
  business: {
    // 咨询会话超时时间（秒）
    consultationTimeout: parseInt(process.env.CONSULTATION_TIMEOUT) || 1800, // 30分钟
    
    // 消息重试次数
    messageRetryCount: parseInt(process.env.MESSAGE_RETRY_COUNT) || 3,
    
    // 客服最大同时服务用户数
    maxConcurrentUsers: parseInt(process.env.MAX_CONCURRENT_USERS) || 10,
    
    // 自动分配客服策略 (random, round_robin, least_busy)
    staffAssignStrategy: process.env.STAFF_ASSIGN_STRATEGY || 'least_busy',
    
    // 消息推送配置
    push: {
      enabled: process.env.PUSH_ENABLED === 'true',
      batchSize: parseInt(process.env.PUSH_BATCH_SIZE) || 100,
      retryCount: parseInt(process.env.PUSH_RETRY_COUNT) || 3
    },
    
    // 数据清理配置
    cleanup: {
      // 消息保留天数
      messageRetentionDays: parseInt(process.env.MESSAGE_RETENTION_DAYS) || 90,
      // 咨询记录保留天数
      consultationRetentionDays: parseInt(process.env.CONSULTATION_RETENTION_DAYS) || 365,
      // 日志保留天数
      logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30
    }
  },
  
  // 安全配置
  security: {
    // 密码加密轮数
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    
    // 请求频率限制
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // 最大请求数
      message: 'Too many requests from this IP, please try again later.'
    },
    
    // IP白名单（管理员接口）
    adminWhitelist: process.env.ADMIN_WHITELIST ? process.env.ADMIN_WHITELIST.split(',') : [],
    
    // 敏感词过滤
    sensitiveWords: {
      enabled: process.env.SENSITIVE_WORDS_ENABLED === 'true',
      action: process.env.SENSITIVE_WORDS_ACTION || 'filter' // filter, block, warn
    }
  },
  
  // 监控配置
  monitoring: {
    // 健康检查间隔（秒）
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30,
    
    // 性能监控
    performance: {
      enabled: process.env.PERFORMANCE_MONITORING_ENABLED === 'true',
      sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE) || 0.1
    },
    
    // 错误报告
    errorReporting: {
      enabled: process.env.ERROR_REPORTING_ENABLED === 'true',
      webhook: process.env.ERROR_REPORTING_WEBHOOK || ''
    }
  }
}

// 环境特定配置覆盖
if (config.env === 'production') {
  // 生产环境配置
  config.logging.level = 'warn'
  config.database.logging = false
  config.security.rateLimit.max = 500
} else if (config.env === 'test') {
  // 测试环境配置
  config.database.database = 'xyfservice_test'
  config.redis.db = 1
  config.logging.level = 'error'
  config.logging.console.enabled = false
}

// 配置验证
function validateConfig() {
  const required = [
    'wechat.appId',
    'wechat.appSecret',
    'jwt.secret'
  ]
  
  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config)
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`)
    }
  }
}

// 在生产环境中验证配置
if (config.env === 'production') {
  validateConfig()
}

module.exports = config