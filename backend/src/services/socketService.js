const jwt = require('jsonwebtoken')
const config = require('../../config/config')
const redis = require('../../config/redis')
const logger = require('../utils/logger')

// 存储在线用户和客服
const onlineUsers = new Map() // userId -> socketId
const onlineStaff = new Map() // staffId -> socketId
const socketUsers = new Map() // socketId -> {userId, userType}

/**
 * Socket.IO 事件处理
 */
function socketHandler(io) {
  // 中间件：身份验证
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('缺少访问令牌'))
      }
      
      // 验证JWT token
      const decoded = jwt.verify(token, config.jwt.secret)
      
      // 检查token是否在黑名单中
      const isBlacklisted = await redis.get(`blacklist:${token}`)
      if (isBlacklisted) {
        return next(new Error('令牌已失效'))
      }
      
      // 将用户信息附加到socket
      socket.userId = decoded.userId
      socket.userType = decoded.userType
      socket.role = decoded.role
      
      logger.info('Socket连接认证成功', {
        socketId: socket.id,
        userId: decoded.userId,
        userType: decoded.userType
      })
      
      next()
    } catch (error) {
      logger.error('Socket认证失败:', error)
      next(new Error('令牌无效或已过期'))
    }
  })
  
  // 连接事件
  io.on('connection', (socket) => {
    logger.info('新的Socket连接', {
      socketId: socket.id,
      userId: socket.userId,
      userType: socket.userType
    })
    
    // 根据用户类型处理连接
    if (socket.userType === 'user') {
      handleUserConnection(socket, io)
    } else if (socket.userType === 'staff') {
      handleStaffConnection(socket, io)
    } else if (socket.userType === 'admin') {
      handleAdminConnection(socket, io)
    }
    
    // 通用事件处理
    setupCommonEvents(socket, io)
    
    // 断开连接事件
    socket.on('disconnect', (reason) => {
      handleDisconnection(socket, io, reason)
    })
  })
}

/**
 * 处理用户连接
 */
function handleUserConnection(socket, io) {
  const userId = socket.userId
  
  // 记录在线用户
  onlineUsers.set(userId, socket.id)
  socketUsers.set(socket.id, { userId, userType: 'user' })
  
  // 加入用户房间
  socket.join(`user:${userId}`)
  
  // 通知客服用户上线
  socket.broadcast.to('staff').emit('userOnline', {
    userId,
    timestamp: new Date().toISOString()
  })
  
  // 用户特定事件
  socket.on('joinConsultation', async (data) => {
    await handleJoinConsultation(socket, io, data)
  })
  
  socket.on('leaveConsultation', async (data) => {
    await handleLeaveConsultation(socket, io, data)
  })
  
  socket.on('sendMessage', async (data) => {
    await handleSendMessage(socket, io, data)
  })
  
  socket.on('typing', async (data) => {
    await handleTyping(socket, io, data)
  })
  
  socket.on('stopTyping', async (data) => {
    await handleStopTyping(socket, io, data)
  })
  
  socket.on('markAsRead', async (data) => {
    await handleMarkAsRead(socket, io, data)
  })
  
  logger.info('用户连接成功', { userId, socketId: socket.id })
}

/**
 * 处理客服连接
 */
function handleStaffConnection(socket, io) {
  const staffId = socket.userId
  
  // 记录在线客服
  onlineStaff.set(staffId, socket.id)
  socketUsers.set(socket.id, { userId: staffId, userType: 'staff' })
  
  // 加入客服房间
  socket.join('staff')
  socket.join(`staff:${staffId}`)
  
  // 通知其他客服上线
  socket.broadcast.to('staff').emit('staffOnline', {
    staffId,
    timestamp: new Date().toISOString()
  })
  
  // 客服特定事件
  socket.on('acceptConsultation', async (data) => {
    await handleAcceptConsultation(socket, io, data)
  })
  
  socket.on('transferConsultation', async (data) => {
    await handleTransferConsultation(socket, io, data)
  })
  
  socket.on('closeConsultation', async (data) => {
    await handleCloseConsultation(socket, io, data)
  })
  
  socket.on('updateStatus', async (data) => {
    await handleUpdateStaffStatus(socket, io, data)
  })
  
  logger.info('客服连接成功', { staffId, socketId: socket.id })
}

/**
 * 处理管理员连接
 */
function handleAdminConnection(socket, io) {
  const adminId = socket.userId
  
  socketUsers.set(socket.id, { userId: adminId, userType: 'admin' })
  
  // 加入管理员房间
  socket.join('admin')
  socket.join(`admin:${adminId}`)
  
  // 管理员特定事件
  socket.on('broadcastMessage', async (data) => {
    await handleBroadcastMessage(socket, io, data)
  })
  
  socket.on('systemNotification', async (data) => {
    await handleSystemNotification(socket, io, data)
  })
  
  logger.info('管理员连接成功', { adminId, socketId: socket.id })
}

/**
 * 设置通用事件
 */
function setupCommonEvents(socket, io) {
  // 心跳检测
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })
  
  // 获取在线状态
  socket.on('getOnlineStatus', () => {
    socket.emit('onlineStatus', {
      users: onlineUsers.size,
      staff: onlineStaff.size,
      timestamp: new Date().toISOString()
    })
  })
}

/**
 * 处理加入咨询
 */
async function handleJoinConsultation(socket, io, data) {
  try {
    const { consultationId } = data
    const userId = socket.userId
    
    // 验证咨询是否存在且用户有权限
    // 这里应该调用数据库验证逻辑
    
    // 加入咨询房间
    socket.join(`consultation:${consultationId}`)
    
    // 通知房间内其他人
    socket.to(`consultation:${consultationId}`).emit('userJoined', {
      userId,
      consultationId,
      timestamp: new Date().toISOString()
    })
    
    // 缓存用户当前咨询
    await redis.set(`user:${userId}:current_consultation`, consultationId, 3600)
    
    logger.info('用户加入咨询', { userId, consultationId })
    
  } catch (error) {
    logger.error('处理加入咨询失败:', error)
    socket.emit('error', { message: '加入咨询失败' })
  }
}

/**
 * 处理离开咨询
 */
async function handleLeaveConsultation(socket, io, data) {
  try {
    const { consultationId } = data
    const userId = socket.userId
    
    // 离开咨询房间
    socket.leave(`consultation:${consultationId}`)
    
    // 通知房间内其他人
    socket.to(`consultation:${consultationId}`).emit('userLeft', {
      userId,
      consultationId,
      timestamp: new Date().toISOString()
    })
    
    // 清除缓存
    await redis.del(`user:${userId}:current_consultation`)
    
    logger.info('用户离开咨询', { userId, consultationId })
    
  } catch (error) {
    logger.error('处理离开咨询失败:', error)
    socket.emit('error', { message: '离开咨询失败' })
  }
}

/**
 * 处理发送消息
 */
async function handleSendMessage(socket, io, data) {
  try {
    const { consultationId, messageType, content, extra } = data
    const senderId = socket.userId
    const senderType = socket.userType
    
    // 创建消息对象
    const message = {
      id: Date.now(), // 临时ID，实际应该从数据库获取
      consultationId,
      senderId,
      senderType,
      messageType,
      content,
      extra,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
    
    // 发送给咨询房间内的所有人
    io.to(`consultation:${consultationId}`).emit('newMessage', message)
    
    // 如果是用户发送的消息，通知对应的客服
    if (senderType === 'user') {
      // 获取咨询的客服ID
      const staffId = await getConsultationStaffId(consultationId)
      if (staffId && onlineStaff.has(staffId)) {
        io.to(`staff:${staffId}`).emit('newUserMessage', {
          ...message,
          consultationId
        })
      }
    }
    
    // 这里应该调用API保存消息到数据库
    
    logger.info('消息发送成功', {
      senderId,
      senderType,
      consultationId,
      messageType
    })
    
  } catch (error) {
    logger.error('处理发送消息失败:', error)
    socket.emit('messageError', { message: '发送消息失败' })
  }
}

/**
 * 处理正在输入
 */
async function handleTyping(socket, io, data) {
  try {
    const { consultationId } = data
    const userId = socket.userId
    const userType = socket.userType
    
    // 通知咨询房间内的其他人
    socket.to(`consultation:${consultationId}`).emit('userTyping', {
      userId,
      userType,
      consultationId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('处理正在输入失败:', error)
  }
}

/**
 * 处理停止输入
 */
async function handleStopTyping(socket, io, data) {
  try {
    const { consultationId } = data
    const userId = socket.userId
    const userType = socket.userType
    
    // 通知咨询房间内的其他人
    socket.to(`consultation:${consultationId}`).emit('userStoppedTyping', {
      userId,
      userType,
      consultationId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('处理停止输入失败:', error)
  }
}

/**
 * 处理标记已读
 */
async function handleMarkAsRead(socket, io, data) {
  try {
    const { consultationId, messageIds } = data
    const userId = socket.userId
    
    // 通知发送者消息已读
    socket.to(`consultation:${consultationId}`).emit('messagesRead', {
      consultationId,
      messageIds,
      readBy: userId,
      timestamp: new Date().toISOString()
    })
    
    // 这里应该调用API更新数据库
    
  } catch (error) {
    logger.error('处理标记已读失败:', error)
  }
}

/**
 * 处理接受咨询
 */
async function handleAcceptConsultation(socket, io, data) {
  try {
    const { consultationId } = data
    const staffId = socket.userId
    
    // 加入咨询房间
    socket.join(`consultation:${consultationId}`)
    
    // 通知用户客服已接入
    io.to(`consultation:${consultationId}`).emit('staffJoined', {
      staffId,
      consultationId,
      timestamp: new Date().toISOString()
    })
    
    // 这里应该调用API更新咨询状态
    
    logger.info('客服接受咨询', { staffId, consultationId })
    
  } catch (error) {
    logger.error('处理接受咨询失败:', error)
    socket.emit('error', { message: '接受咨询失败' })
  }
}

/**
 * 处理转接咨询
 */
async function handleTransferConsultation(socket, io, data) {
  try {
    const { consultationId, targetStaffId, reason } = data
    const fromStaffId = socket.userId
    
    // 通知目标客服
    if (onlineStaff.has(targetStaffId)) {
      io.to(`staff:${targetStaffId}`).emit('consultationTransferred', {
        consultationId,
        fromStaffId,
        reason,
        timestamp: new Date().toISOString()
      })
    }
    
    // 通知咨询房间
    io.to(`consultation:${consultationId}`).emit('consultationTransferring', {
      fromStaffId,
      targetStaffId,
      reason,
      timestamp: new Date().toISOString()
    })
    
    logger.info('咨询转接', { fromStaffId, targetStaffId, consultationId })
    
  } catch (error) {
    logger.error('处理转接咨询失败:', error)
    socket.emit('error', { message: '转接咨询失败' })
  }
}

/**
 * 处理关闭咨询
 */
async function handleCloseConsultation(socket, io, data) {
  try {
    const { consultationId, reason } = data
    const staffId = socket.userId
    
    // 通知咨询房间
    io.to(`consultation:${consultationId}`).emit('consultationClosed', {
      staffId,
      reason,
      timestamp: new Date().toISOString()
    })
    
    // 这里应该调用API更新咨询状态
    
    logger.info('咨询关闭', { staffId, consultationId, reason })
    
  } catch (error) {
    logger.error('处理关闭咨询失败:', error)
    socket.emit('error', { message: '关闭咨询失败' })
  }
}

/**
 * 处理客服状态更新
 */
async function handleUpdateStaffStatus(socket, io, data) {
  try {
    const { status } = data
    const staffId = socket.userId
    
    // 通知其他客服
    socket.broadcast.to('staff').emit('staffStatusChanged', {
      staffId,
      status,
      timestamp: new Date().toISOString()
    })
    
    // 缓存状态
    await redis.set(`staff:${staffId}:status`, status, 3600)
    
    logger.info('客服状态更新', { staffId, status })
    
  } catch (error) {
    logger.error('处理客服状态更新失败:', error)
  }
}

/**
 * 处理广播消息
 */
async function handleBroadcastMessage(socket, io, data) {
  try {
    const { message, target } = data
    const adminId = socket.userId
    
    const broadcastData = {
      message,
      from: adminId,
      timestamp: new Date().toISOString()
    }
    
    // 根据目标广播
    if (target === 'all') {
      io.emit('systemBroadcast', broadcastData)
    } else if (target === 'users') {
      onlineUsers.forEach((socketId) => {
        io.to(socketId).emit('systemBroadcast', broadcastData)
      })
    } else if (target === 'staff') {
      io.to('staff').emit('systemBroadcast', broadcastData)
    }
    
    logger.info('系统广播', { adminId, target, message })
    
  } catch (error) {
    logger.error('处理广播消息失败:', error)
  }
}

/**
 * 处理系统通知
 */
async function handleSystemNotification(socket, io, data) {
  try {
    const { notification, target, targetId } = data
    const adminId = socket.userId
    
    const notificationData = {
      ...notification,
      from: adminId,
      timestamp: new Date().toISOString()
    }
    
    // 发送通知
    if (target === 'user' && targetId) {
      io.to(`user:${targetId}`).emit('systemNotification', notificationData)
    } else if (target === 'staff' && targetId) {
      io.to(`staff:${targetId}`).emit('systemNotification', notificationData)
    }
    
    logger.info('系统通知', { adminId, target, targetId })
    
  } catch (error) {
    logger.error('处理系统通知失败:', error)
  }
}

/**
 * 处理断开连接
 */
function handleDisconnection(socket, io, reason) {
  const socketInfo = socketUsers.get(socket.id)
  
  if (socketInfo) {
    const { userId, userType } = socketInfo
    
    // 清理在线状态
    if (userType === 'user') {
      onlineUsers.delete(userId)
      // 通知客服用户下线
      socket.broadcast.to('staff').emit('userOffline', {
        userId,
        timestamp: new Date().toISOString()
      })
    } else if (userType === 'staff') {
      onlineStaff.delete(userId)
      // 通知其他客服下线
      socket.broadcast.to('staff').emit('staffOffline', {
        staffId: userId,
        timestamp: new Date().toISOString()
      })
    }
    
    socketUsers.delete(socket.id)
    
    logger.info('Socket断开连接', {
      socketId: socket.id,
      userId,
      userType,
      reason
    })
  }
}

/**
 * 辅助函数：获取咨询的客服ID
 */
async function getConsultationStaffId(consultationId) {
  try {
    // 这里应该从数据库或缓存中获取
    const staffId = await redis.get(`consultation:${consultationId}:staff`)
    return staffId
  } catch (error) {
    logger.error('获取咨询客服ID失败:', error)
    return null
  }
}

/**
 * 获取在线统计
 */
function getOnlineStats() {
  return {
    users: onlineUsers.size,
    staff: onlineStaff.size,
    total: onlineUsers.size + onlineStaff.size
  }
}

/**
 * 向特定用户发送消息
 */
function sendToUser(io, userId, event, data) {
  const socketId = onlineUsers.get(userId)
  if (socketId) {
    io.to(socketId).emit(event, data)
    return true
  }
  return false
}

/**
 * 向特定客服发送消息
 */
function sendToStaff(io, staffId, event, data) {
  const socketId = onlineStaff.get(staffId)
  if (socketId) {
    io.to(socketId).emit(event, data)
    return true
  }
  return false
}

/**
 * 向咨询房间发送消息
 */
function sendToConsultation(io, consultationId, event, data) {
  io.to(`consultation:${consultationId}`).emit(event, data)
}

module.exports = socketHandler
module.exports.getOnlineStats = getOnlineStats
module.exports.sendToUser = sendToUser
module.exports.sendToStaff = sendToStaff
module.exports.sendToConsultation = sendToConsultation