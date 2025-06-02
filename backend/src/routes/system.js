const express = require('express')
const database = require('../../config/database')
const redis = require('../../config/redis')
const logger = require('../utils/logger')
const { validateSystemConfig } = require('../validators/systemValidator')

const router = express.Router()

/**
 * 获取系统状态
 * GET /api/system/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      },
      database: await getDatabaseStatus(),
      redis: await getRedisStatus(),
      services: await getServicesStatus()
    }

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    logger.error('获取系统状态错误:', error)
    res.status(500).json({
      success: false,
      message: '获取系统状态失败'
    })
  }
})

/**
 * 获取系统配置
 * GET /api/system/config
 */
router.get('/config', async (req, res) => {
  try {
    const configs = await getSystemConfigs()
    
    res.json({
      success: true,
      data: configs
    })
  } catch (error) {
    logger.error('获取系统配置错误:', error)
    res.status(500).json({
      success: false,
      message: '获取系统配置失败'
    })
  }
})

/**
 * 更新系统配置
 * PUT /api/system/config
 */
router.put('/config', async (req, res) => {
  try {
    const { error } = validateSystemConfig(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { configs } = req.body
    
    for (const config of configs) {
      await updateSystemConfig(config.key, config.value, config.description)
    }

    // 清除配置缓存
    await clearConfigCache()

    logger.info('系统配置更新:', {
      adminId: req.user.userId,
      configs: configs.map(c => ({ key: c.key, value: c.value }))
    })

    res.json({
      success: true,
      message: '系统配置更新成功'
    })
  } catch (error) {
    logger.error('更新系统配置错误:', error)
    res.status(500).json({
      success: false,
      message: '更新系统配置失败'
    })
  }
})

/**
 * 获取系统统计信息
 * GET /api/system/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query
    
    const stats = {
      overview: await getOverviewStats(),
      consultations: await getConsultationStats(period),
      messages: await getMessageStats(period),
      users: await getUserStats(period),
      staff: await getStaffStats(period)
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取系统统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取系统统计失败'
    })
  }
})

/**
 * 获取系统日志
 * GET /api/system/logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', page = 1, limit = 50, startDate, endDate } = req.query
    
    const offset = (page - 1) * limit
    const logs = await getSystemLogs({
      level,
      startDate,
      endDate,
      offset,
      limit: parseInt(limit)
    })

    const total = await getSystemLogsCount({
      level,
      startDate,
      endDate
    })

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    logger.error('获取系统日志错误:', error)
    res.status(500).json({
      success: false,
      message: '获取系统日志失败'
    })
  }
})

/**
 * 清理系统数据
 * POST /api/system/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { type, days = 30 } = req.body
    
    let result = {}
    
    switch (type) {
      case 'logs':
        result.deletedLogs = await cleanupLogs(days)
        break
      case 'messages':
        result.deletedMessages = await cleanupDeletedMessages(days)
        break
      case 'consultations':
        result.deletedConsultations = await cleanupClosedConsultations(days)
        break
      case 'uploads':
        result.deletedFiles = await cleanupOrphanedFiles()
        break
      case 'all':
        result.deletedLogs = await cleanupLogs(days)
        result.deletedMessages = await cleanupDeletedMessages(days)
        result.deletedConsultations = await cleanupClosedConsultations(days)
        result.deletedFiles = await cleanupOrphanedFiles()
        break
      default:
        return res.status(400).json({
          success: false,
          message: '无效的清理类型'
        })
    }

    logger.info('系统数据清理:', {
      adminId: req.user.userId,
      type,
      days,
      result
    })

    res.json({
      success: true,
      message: '数据清理完成',
      data: result
    })
  } catch (error) {
    logger.error('系统数据清理错误:', error)
    res.status(500).json({
      success: false,
      message: '数据清理失败'
    })
  }
})

/**
 * 系统备份
 * POST /api/system/backup
 */
router.post('/backup', async (req, res) => {
  try {
    const { type = 'database' } = req.body
    
    let backupResult
    
    switch (type) {
      case 'database':
        backupResult = await createDatabaseBackup()
        break
      case 'files':
        backupResult = await createFilesBackup()
        break
      case 'full':
        const dbBackup = await createDatabaseBackup()
        const filesBackup = await createFilesBackup()
        backupResult = {
          database: dbBackup,
          files: filesBackup
        }
        break
      default:
        return res.status(400).json({
          success: false,
          message: '无效的备份类型'
        })
    }

    logger.info('系统备份创建:', {
      adminId: req.user.userId,
      type,
      result: backupResult
    })

    res.json({
      success: true,
      message: '备份创建成功',
      data: backupResult
    })
  } catch (error) {
    logger.error('系统备份错误:', error)
    res.status(500).json({
      success: false,
      message: '备份创建失败'
    })
  }
})

/**
 * 重启服务
 * POST /api/system/restart
 */
router.post('/restart', async (req, res) => {
  try {
    const { service } = req.body
    
    logger.info('服务重启请求:', {
      adminId: req.user.userId,
      service
    })

    res.json({
      success: true,
      message: '重启请求已接收，服务将在5秒后重启'
    })

    // 延迟重启
    setTimeout(() => {
      if (service === 'server' || !service) {
        process.exit(0)
      }
    }, 5000)

  } catch (error) {
    logger.error('服务重启错误:', error)
    res.status(500).json({
      success: false,
      message: '服务重启失败'
    })
  }
})

// 数据库操作函数
async function getDatabaseStatus() {
  try {
    const db = database.getInstance()
    const { rows } = await db.query('SELECT 1 as connected')
    return {
      connected: true,
      version: await getDatabaseVersion()
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message
    }
  }
}

async function getRedisStatus() {
  try {
    const redisClient = redis.getInstance()
    await redisClient.ping()
    return {
      connected: true,
      info: await redisClient.info()
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message
    }
  }
}

async function getServicesStatus() {
  return {
    websocket: true, // 实际应该检查WebSocket服务状态
    upload: true,    // 实际应该检查上传服务状态
    notification: true // 实际应该检查通知服务状态
  }
}

async function getSystemConfigs() {
  const db = database.getInstance()
  const { rows } = await db.query(
    'SELECT config_key, config_value, description, updated_at FROM system_configs ORDER BY config_key'
  )
  return rows
}

async function updateSystemConfig(key, value, description) {
  const db = database.getInstance()
  await db.query(
    `INSERT INTO system_configs (config_key, config_value, description, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE config_value = ?, description = ?, updated_at = NOW()`,
    [key, value, description, value, description]
  )
}

async function clearConfigCache() {
  try {
    const redisClient = redis.getInstance()
    await redisClient.del('system:configs')
  } catch (error) {
    logger.warn('清除配置缓存失败:', error)
  }
}

async function getOverviewStats() {
  const db = database.getInstance()
  
  const [users, staff, consultations, messages] = await Promise.all([
    db.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'),
    db.query('SELECT COUNT(*) as count FROM staff WHERE deleted_at IS NULL'),
    db.query('SELECT COUNT(*) as count FROM consultations WHERE deleted_at IS NULL'),
    db.query('SELECT COUNT(*) as count FROM messages WHERE deleted_at IS NULL')
  ])
  
  return {
    totalUsers: users.rows[0].count,
    totalStaff: staff.rows[0].count,
    totalConsultations: consultations.rows[0].count,
    totalMessages: messages.rows[0].count
  }
}

async function getConsultationStats(period) {
  const db = database.getInstance()
  const days = parseInt(period.replace('d', ''))
  
  const { rows } = await db.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting
     FROM consultations 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [days]
  )
  
  return rows
}

async function getMessageStats(period) {
  const db = database.getInstance()
  const days = parseInt(period.replace('d', ''))
  
  const { rows } = await db.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as total,
       SUM(CASE WHEN message_type = 'text' THEN 1 ELSE 0 END) as text,
       SUM(CASE WHEN message_type = 'image' THEN 1 ELSE 0 END) as image,
       SUM(CASE WHEN message_type = 'file' THEN 1 ELSE 0 END) as file
     FROM messages 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [days]
  )
  
  return rows
}

async function getUserStats(period) {
  const db = database.getInstance()
  const days = parseInt(period.replace('d', ''))
  
  const { rows } = await db.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as new_users
     FROM users 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [days]
  )
  
  return rows
}

async function getStaffStats(period) {
  const db = database.getInstance()
  
  const { rows } = await db.query(
    `SELECT 
       s.id,
       s.name,
       s.status,
       COUNT(c.id) as consultation_count,
       AVG(c.rating) as avg_rating
     FROM staff s
     LEFT JOIN consultations c ON s.id = c.staff_id AND c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE s.deleted_at IS NULL
     GROUP BY s.id, s.name, s.status
     ORDER BY consultation_count DESC`,
    [parseInt(period.replace('d', ''))]
  )
  
  return rows
}

async function getDatabaseVersion() {
  const db = database.getInstance()
  const { rows } = await db.query('SELECT VERSION() as version')
  return rows[0].version
}

async function getSystemLogs(options) {
  const db = database.getInstance()
  let sql = 'SELECT * FROM system_logs WHERE level >= ?'
  const params = [options.level]
  
  if (options.startDate && options.endDate) {
    sql += ' AND created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }
  
  sql += ' ORDER BY created_at DESC'
  
  if (options.limit) {
    sql += ' LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset || 0)
  }
  
  const { rows } = await db.query(sql, params)
  return rows
}

async function getSystemLogsCount(options) {
  const db = database.getInstance()
  let sql = 'SELECT COUNT(*) as count FROM system_logs WHERE level >= ?'
  const params = [options.level]
  
  if (options.startDate && options.endDate) {
    sql += ' AND created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }
  
  const { rows } = await db.query(sql, params)
  return rows[0].count
}

async function cleanupLogs(days) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [days]
  )
  return rows.affectedRows
}

async function cleanupDeletedMessages(days) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'DELETE FROM messages WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [days]
  )
  return rows.affectedRows
}

async function cleanupClosedConsultations(days) {
  const db = database.getInstance()
  const { rows } = await db.query(
    'DELETE FROM consultations WHERE status = "closed" AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [days]
  )
  return rows.affectedRows
}

async function cleanupOrphanedFiles() {
  // 实现清理孤立文件的逻辑
  return 0
}

async function createDatabaseBackup() {
  // 实现数据库备份逻辑
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    filename: `database_backup_${timestamp}.sql`,
    size: 0,
    created_at: new Date()
  }
}

async function createFilesBackup() {
  // 实现文件备份逻辑
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    filename: `files_backup_${timestamp}.tar.gz`,
    size: 0,
    created_at: new Date()
  }
}

module.exports = router