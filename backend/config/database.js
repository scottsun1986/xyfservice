const mysql = require('mysql2/promise')
const config = require('./config')
const logger = require('../src/utils/logger')

class Database {
  constructor() {
    this.pool = null
    this.isConnected = false
  }

  // 初始化数据库连接池
  async initialize() {
    try {
      this.pool = mysql.createPool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.username,
        password: config.database.password,
        database: config.database.database,
        charset: config.database.charset,
        timezone: config.database.timezone,
        acquireTimeout: config.database.pool.acquire,
        timeout: 60000,
        reconnect: true,
        connectionLimit: config.database.pool.max,
        queueLimit: 0,
        // 连接池配置
        ...config.database.pool
      })

      // 测试连接
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      
      this.isConnected = true
      logger.info('数据库连接池初始化成功')
      
      // 监听连接池事件
      this.pool.on('connection', (connection) => {
        logger.debug(`新的数据库连接建立: ${connection.threadId}`)
      })
      
      this.pool.on('error', (err) => {
        logger.error('数据库连接池错误:', err)
        this.isConnected = false
        
        // 尝试重新连接
        setTimeout(() => {
          this.reconnect()
        }, 5000)
      })
      
      return this.pool
    } catch (error) {
      logger.error('数据库连接失败:', error)
      throw error
    }
  }

  // 重新连接
  async reconnect() {
    try {
      logger.info('尝试重新连接数据库...')
      await this.close()
      await this.initialize()
      logger.info('数据库重新连接成功')
    } catch (error) {
      logger.error('数据库重新连接失败:', error)
      // 继续尝试重连
      setTimeout(() => {
        this.reconnect()
      }, 10000)
    }
  }

  // 获取连接
  async getConnection() {
    if (!this.pool) {
      await this.initialize()
    }
    return this.pool.getConnection()
  }

  // 执行查询
  async query(sql, params = []) {
    let connection
    try {
      connection = await this.getConnection()
      const [rows, fields] = await connection.execute(sql, params)
      return { rows, fields }
    } catch (error) {
      logger.error('数据库查询错误:', { sql, params, error: error.message })
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  // 执行事务
  async transaction(callback) {
    let connection
    try {
      connection = await this.getConnection()
      await connection.beginTransaction()
      
      const result = await callback(connection)
      
      await connection.commit()
      return result
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      logger.error('事务执行错误:', error)
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  // 批量插入
  async batchInsert(table, columns, data) {
    if (!data || data.length === 0) {
      return { affectedRows: 0 }
    }

    const placeholders = columns.map(() => '?').join(', ')
    const values = data.map(() => `(${placeholders})`).join(', ')
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values}`
    
    const params = data.flat()
    
    try {
      const { rows } = await this.query(sql, params)
      return rows
    } catch (error) {
      logger.error('批量插入错误:', { table, columns, dataLength: data.length, error: error.message })
      throw error
    }
  }

  // 分页查询
  async paginate(sql, params = [], page = 1, limit = 10) {
    const offset = (page - 1) * limit
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_table`
    const { rows: countRows } = await this.query(countSql, params)
    const total = countRows[0].total
    
    // 获取分页数据
    const dataSql = `${sql} LIMIT ? OFFSET ?`
    const { rows: dataRows } = await this.query(dataSql, [...params, limit, offset])
    
    return {
      data: dataRows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }

  // 健康检查
  async healthCheck() {
    try {
      const { rows } = await this.query('SELECT 1 as health')
      return {
        status: 'healthy',
        connected: this.isConnected,
        result: rows[0]
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      }
    }
  }

  // 获取连接池状态
  getPoolStatus() {
    if (!this.pool) {
      return {
        connected: false,
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0
      }
    }

    return {
      connected: this.isConnected,
      totalConnections: this.pool._allConnections ? this.pool._allConnections.length : 0,
      activeConnections: this.pool._acquiringConnections ? this.pool._acquiringConnections.length : 0,
      idleConnections: this.pool._freeConnections ? this.pool._freeConnections.length : 0,
      queuedRequests: this.pool._connectionQueue ? this.pool._connectionQueue.length : 0
    }
  }

  // 关闭连接池
  async close() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      this.isConnected = false
      logger.info('数据库连接池已关闭')
    }
  }

  // 数据库迁移
  async migrate() {
    try {
      logger.info('开始数据库迁移...')
      
      // 创建迁移记录表
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // 执行迁移文件
      const fs = require('fs')
      const path = require('path')
      const migrationsDir = path.join(__dirname, '../database/migrations')
      
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'))
          .sort()
        
        for (const file of files) {
          const { rows } = await this.query(
            'SELECT id FROM migrations WHERE name = ?',
            [file]
          )
          
          if (rows.length === 0) {
            logger.info(`执行迁移: ${file}`)
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
            
            // 分割SQL语句（以分号分隔）
            const statements = sql.split(';').filter(stmt => stmt.trim())
            
            await this.transaction(async (connection) => {
              for (const statement of statements) {
                if (statement.trim()) {
                  await connection.execute(statement)
                }
              }
              
              // 记录迁移
              await connection.execute(
                'INSERT INTO migrations (name) VALUES (?)',
                [file]
              )
            })
            
            logger.info(`迁移完成: ${file}`)
          }
        }
      }
      
      logger.info('数据库迁移完成')
    } catch (error) {
      logger.error('数据库迁移失败:', error)
      throw error
    }
  }

  // 数据库种子数据
  async seed() {
    try {
      logger.info('开始插入种子数据...')
      
      const fs = require('fs')
      const path = require('path')
      const seedsDir = path.join(__dirname, '../database/seeds')
      
      if (fs.existsSync(seedsDir)) {
        const files = fs.readdirSync(seedsDir)
          .filter(file => file.endsWith('.sql'))
          .sort()
        
        for (const file of files) {
          logger.info(`执行种子数据: ${file}`)
          const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8')
          
          const statements = sql.split(';').filter(stmt => stmt.trim())
          
          for (const statement of statements) {
            if (statement.trim()) {
              await this.query(statement)
            }
          }
          
          logger.info(`种子数据完成: ${file}`)
        }
      }
      
      logger.info('种子数据插入完成')
    } catch (error) {
      logger.error('种子数据插入失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const database = new Database()

module.exports = database