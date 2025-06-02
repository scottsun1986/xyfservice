const Redis = require('redis')
const config = require('./config')
const logger = require('../src/utils/logger')

class RedisClient {
  constructor() {
    this.client = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
  }

  // 初始化Redis连接
  async initialize() {
    try {
      this.client = Redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        enableReadyCheck: config.redis.enableReadyCheck,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        lazyConnect: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        }
      })

      // 监听连接事件
      this.client.on('connect', () => {
        logger.info('Redis连接建立')
        this.isConnected = true
        this.reconnectAttempts = 0
      })

      this.client.on('ready', () => {
        logger.info('Redis连接就绪')
        this.isConnected = true
      })

      this.client.on('error', (err) => {
        logger.error('Redis连接错误:', err)
        this.isConnected = false
      })

      this.client.on('close', () => {
        logger.warn('Redis连接关闭')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++
        logger.info(`Redis重连中... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('Redis重连次数超过限制，停止重连')
          this.client.disconnect()
        }
      })

      // 建立连接
      await this.client.connect()
      
      // 测试连接
      await this.client.ping()
      
      logger.info('Redis初始化成功')
      return this.client
      
    } catch (error) {
      logger.error('Redis初始化失败:', error)
      throw error
    }
  }

  // 获取客户端实例
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis客户端未初始化或连接已断开')
    }
    return this.client
  }

  // 检查连接状态
  isReady() {
    return this.isConnected && this.client && this.client.isReady
  }

  // 设置键值对
  async set(key, value, ttl = null) {
    try {
      const client = this.getClient()
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value
      
      if (ttl) {
        return await client.setEx(key, ttl, serializedValue)
      } else {
        return await client.set(key, serializedValue)
      }
    } catch (error) {
      logger.error('Redis SET错误:', { key, error: error.message })
      throw error
    }
  }

  // 设置键值对（带过期时间）
  async setex(key, seconds, value) {
    return this.set(key, value, seconds)
  }

  // 获取值
  async get(key) {
    try {
      const client = this.getClient()
      const value = await client.get(key)
      
      if (value === null) {
        return null
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      logger.error('Redis GET错误:', { key, error: error.message })
      throw error
    }
  }

  // 删除键
  async del(key) {
    try {
      const client = this.getClient()
      return await client.del(key)
    } catch (error) {
      logger.error('Redis DEL错误:', { key, error: error.message })
      throw error
    }
  }

  // 检查键是否存在
  async exists(key) {
    try {
      const client = this.getClient()
      return await client.exists(key)
    } catch (error) {
      logger.error('Redis EXISTS错误:', { key, error: error.message })
      throw error
    }
  }

  // 设置过期时间
  async expire(key, seconds) {
    try {
      const client = this.getClient()
      return await client.expire(key, seconds)
    } catch (error) {
      logger.error('Redis EXPIRE错误:', { key, seconds, error: error.message })
      throw error
    }
  }

  // 获取剩余过期时间
  async ttl(key) {
    try {
      const client = this.getClient()
      return await client.ttl(key)
    } catch (error) {
      logger.error('Redis TTL错误:', { key, error: error.message })
      throw error
    }
  }

  // 递增
  async incr(key) {
    try {
      const client = this.getClient()
      return await client.incr(key)
    } catch (error) {
      logger.error('Redis INCR错误:', { key, error: error.message })
      throw error
    }
  }

  // 递减
  async decr(key) {
    try {
      const client = this.getClient()
      return await client.decr(key)
    } catch (error) {
      logger.error('Redis DECR错误:', { key, error: error.message })
      throw error
    }
  }

  // 哈希操作 - 设置字段
  async hset(key, field, value) {
    try {
      const client = this.getClient()
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value
      return await client.hSet(key, field, serializedValue)
    } catch (error) {
      logger.error('Redis HSET错误:', { key, field, error: error.message })
      throw error
    }
  }

  // 哈希操作 - 获取字段
  async hget(key, field) {
    try {
      const client = this.getClient()
      const value = await client.hGet(key, field)
      
      if (value === null) {
        return null
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      logger.error('Redis HGET错误:', { key, field, error: error.message })
      throw error
    }
  }

  // 哈希操作 - 删除字段
  async hdel(key, field) {
    try {
      const client = this.getClient()
      return await client.hDel(key, field)
    } catch (error) {
      logger.error('Redis HDEL错误:', { key, field, error: error.message })
      throw error
    }
  }

  // 哈希操作 - 获取所有字段
  async hgetall(key) {
    try {
      const client = this.getClient()
      const hash = await client.hGetAll(key)
      
      // 尝试解析JSON值
      const result = {}
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value)
        } catch {
          result[field] = value
        }
      }
      
      return result
    } catch (error) {
      logger.error('Redis HGETALL错误:', { key, error: error.message })
      throw error
    }
  }

  // 列表操作 - 左推入
  async lpush(key, ...values) {
    try {
      const client = this.getClient()
      const serializedValues = values.map(v => typeof v === 'object' ? JSON.stringify(v) : v)
      return await client.lPush(key, serializedValues)
    } catch (error) {
      logger.error('Redis LPUSH错误:', { key, error: error.message })
      throw error
    }
  }

  // 列表操作 - 右推入
  async rpush(key, ...values) {
    try {
      const client = this.getClient()
      const serializedValues = values.map(v => typeof v === 'object' ? JSON.stringify(v) : v)
      return await client.rPush(key, serializedValues)
    } catch (error) {
      logger.error('Redis RPUSH错误:', { key, error: error.message })
      throw error
    }
  }

  // 列表操作 - 左弹出
  async lpop(key) {
    try {
      const client = this.getClient()
      const value = await client.lPop(key)
      
      if (value === null) {
        return null
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      logger.error('Redis LPOP错误:', { key, error: error.message })
      throw error
    }
  }

  // 列表操作 - 右弹出
  async rpop(key) {
    try {
      const client = this.getClient()
      const value = await client.rPop(key)
      
      if (value === null) {
        return null
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      logger.error('Redis RPOP错误:', { key, error: error.message })
      throw error
    }
  }

  // 列表操作 - 获取长度
  async llen(key) {
    try {
      const client = this.getClient()
      return await client.lLen(key)
    } catch (error) {
      logger.error('Redis LLEN错误:', { key, error: error.message })
      throw error
    }
  }

  // 集合操作 - 添加成员
  async sadd(key, ...members) {
    try {
      const client = this.getClient()
      const serializedMembers = members.map(m => typeof m === 'object' ? JSON.stringify(m) : m)
      return await client.sAdd(key, serializedMembers)
    } catch (error) {
      logger.error('Redis SADD错误:', { key, error: error.message })
      throw error
    }
  }

  // 集合操作 - 删除成员
  async srem(key, ...members) {
    try {
      const client = this.getClient()
      const serializedMembers = members.map(m => typeof m === 'object' ? JSON.stringify(m) : m)
      return await client.sRem(key, serializedMembers)
    } catch (error) {
      logger.error('Redis SREM错误:', { key, error: error.message })
      throw error
    }
  }

  // 集合操作 - 获取所有成员
  async smembers(key) {
    try {
      const client = this.getClient()
      const members = await client.sMembers(key)
      
      // 尝试解析JSON值
      return members.map(member => {
        try {
          return JSON.parse(member)
        } catch {
          return member
        }
      })
    } catch (error) {
      logger.error('Redis SMEMBERS错误:', { key, error: error.message })
      throw error
    }
  }

  // 有序集合操作 - 添加成员
  async zadd(key, score, member) {
    try {
      const client = this.getClient()
      const serializedMember = typeof member === 'object' ? JSON.stringify(member) : member
      return await client.zAdd(key, { score, value: serializedMember })
    } catch (error) {
      logger.error('Redis ZADD错误:', { key, score, error: error.message })
      throw error
    }
  }

  // 有序集合操作 - 获取范围
  async zrange(key, start, stop, withScores = false) {
    try {
      const client = this.getClient()
      const options = withScores ? { WITHSCORES: true } : {}
      const result = await client.zRange(key, start, stop, options)
      
      if (withScores) {
        // 返回 [{value, score}, ...] 格式
        return result.map(item => ({
          value: this.tryParseJSON(item.value),
          score: item.score
        }))
      } else {
        // 返回值数组
        return result.map(value => this.tryParseJSON(value))
      }
    } catch (error) {
      logger.error('Redis ZRANGE错误:', { key, start, stop, error: error.message })
      throw error
    }
  }

  // 辅助方法 - 尝试解析JSON
  tryParseJSON(value) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  // 发布消息
  async publish(channel, message) {
    try {
      const client = this.getClient()
      const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message
      return await client.publish(channel, serializedMessage)
    } catch (error) {
      logger.error('Redis PUBLISH错误:', { channel, error: error.message })
      throw error
    }
  }

  // 订阅频道
  async subscribe(channel, callback) {
    try {
      const client = this.getClient()
      await client.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message)
          callback(parsedMessage)
        } catch {
          callback(message)
        }
      })
    } catch (error) {
      logger.error('Redis SUBSCRIBE错误:', { channel, error: error.message })
      throw error
    }
  }

  // 取消订阅
  async unsubscribe(channel) {
    try {
      const client = this.getClient()
      return await client.unsubscribe(channel)
    } catch (error) {
      logger.error('Redis UNSUBSCRIBE错误:', { channel, error: error.message })
      throw error
    }
  }

  // 执行Lua脚本
  async eval(script, keys = [], args = []) {
    try {
      const client = this.getClient()
      return await client.eval(script, {
        keys,
        arguments: args
      })
    } catch (error) {
      logger.error('Redis EVAL错误:', { script, keys, args, error: error.message })
      throw error
    }
  }

  // 获取Redis信息
  async info(section = null) {
    try {
      const client = this.getClient()
      return await client.info(section)
    } catch (error) {
      logger.error('Redis INFO错误:', { section, error: error.message })
      throw error
    }
  }

  // 清空数据库
  async flushdb() {
    try {
      const client = this.getClient()
      return await client.flushDb()
    } catch (error) {
      logger.error('Redis FLUSHDB错误:', error)
      throw error
    }
  }

  // 获取所有匹配的键
  async keys(pattern) {
    try {
      const client = this.getClient()
      return await client.keys(pattern)
    } catch (error) {
      logger.error('Redis KEYS错误:', { pattern, error: error.message })
      throw error
    }
  }

  // 扫描键
  async scan(cursor = 0, options = {}) {
    try {
      const client = this.getClient()
      return await client.scan(cursor, options)
    } catch (error) {
      logger.error('Redis SCAN错误:', { cursor, options, error: error.message })
      throw error
    }
  }

  // 关闭连接
  async quit() {
    try {
      if (this.client) {
        await this.client.quit()
        this.isConnected = false
        logger.info('Redis连接已关闭')
      }
    } catch (error) {
      logger.error('关闭Redis连接错误:', error)
      throw error
    }
  }

  // 强制断开连接
  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect()
        this.isConnected = false
        logger.info('Redis连接已断开')
      }
    } catch (error) {
      logger.error('断开Redis连接错误:', error)
      throw error
    }
  }
}

// 创建单例实例
const redisClient = new RedisClient()

// 导出实例和类
module.exports = redisClient
module.exports.RedisClient = RedisClient