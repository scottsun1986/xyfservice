// pages/chat/chat.js
const app = getApp()
const socketService = require('../../utils/socket')
const messageService = require('../../utils/message')
const audioService = require('../../utils/audio')
const fileService = require('../../utils/file')

Page({
  data: {
    // 基础数据
    conversationId: '',
    serviceStaff: {
      id: '',
      name: '客服',
      avatar: '',
      status: 'online', // online, offline, busy
      statusText: '在线'
    },
    userInfo: {},
    
    // 消息相关
    messages: [],
    scrollTop: 0,
    scrollIntoView: '',
    hasMoreMessages: true,
    loadingMore: false,
    
    // 输入相关
    inputText: '',
    voiceMode: false,
    recording: false,
    recordingTime: 0,
    showEmoji: false,
    showMoreActions: false,
    
    // 状态相关
    isConnected: true,
    isTyping: false,
    showMessageMenu: false,
    selectedMessage: null,
    
    // 表情数据
    emojiList: [
      { code: '1f60a', char: '😊' },
      { code: '1f604', char: '😄' },
      { code: '1f603', char: '😃' },
      { code: '1f600', char: '😀' },
      { code: '1f60d', char: '😍' },
      { code: '1f618', char: '😘' },
      { code: '1f617', char: '😗' },
      { code: '1f619', char: '😙' },
      { code: '1f61a', char: '😚' },
      { code: '1f642', char: '🙂' },
      { code: '1f917', char: '🤗' },
      { code: '1f914', char: '🤔' },
      { code: '1f610', char: '😐' },
      { code: '1f611', char: '😑' },
      { code: '1f636', char: '😶' },
      { code: '1f644', char: '🙄' },
      { code: '1f60f', char: '😏' },
      { code: '1f623', char: '😣' },
      { code: '1f625', char: '😥' },
      { code: '1f62e', char: '😮' },
      { code: '1f910', char: '🤐' },
      { code: '1f62f', char: '😯' },
      { code: '1f62a', char: '😪' },
      { code: '1f62b', char: '😫' },
      { code: '1f634', char: '😴' },
      { code: '1f60c', char: '😌' },
      { code: '1f913', char: '🤓' },
      { code: '1f61e', char: '😞' },
      { code: '1f61f', char: '😟' },
      { code: '1f620', char: '😠' },
      { code: '1f621', char: '😡' },
      { code: '1f92c', char: '🤬' },
      { code: '1f97a', char: '🥺' },
      { code: '1f622', char: '😢' },
      { code: '1f62d', char: '😭' },
      { code: '1f631', char: '😱' },
      { code: '1f628', char: '😨' },
      { code: '1f630', char: '😰' },
      { code: '1f975', char: '🥵' },
      { code: '1f976', char: '🥶' },
      { code: '1f924', char: '🤤' },
      { code: '1f60e', char: '😎' },
      { code: '1f913', char: '🤓' },
      { code: '1f9d0', char: '🧐' },
      { code: '1f615', char: '😕' },
      { code: '1f641', char: '🙁' },
      { code: '2639', char: '☹️' },
      { code: '1f62c', char: '😬' },
      { code: '1f643', char: '🙃' },
      { code: '1f637', char: '😷' },
      { code: '1f912', char: '🤒' },
      { code: '1f915', char: '🤕' },
      { code: '1f922', char: '🤢' },
      { code: '1f92e', char: '🤮' },
      { code: '1f927', char: '🤧' },
      { code: '1f607', char: '😇' },
      { code: '1f920', char: '🤠' },
      { code: '1f973', char: '🥳' },
      { code: '1f978', char: '🥸' },
      { code: '1f60b', char: '😋' },
      { code: '1f61b', char: '😛' },
      { code: '1f61c', char: '😜' },
      { code: '1f92a', char: '🤪' },
      { code: '1f61d', char: '😝' },
      { code: '1f911', char: '🤑' },
      { code: '1f917', char: '🤗' }
    ],
    
    // 录音相关
    recordTimer: null,
    recordStartTime: 0,
    
    // 自定义导航栏
    customNavBar: false
  },

  onLoad(options) {
    console.log('Chat page loaded with options:', options)
    
    // 获取传入参数
    const { conversationId, staffId, qrCode } = options
    
    if (conversationId) {
      this.setData({ conversationId })
      this.loadConversation(conversationId)
    } else if (staffId) {
      this.createConversation(staffId)
    } else if (qrCode) {
      this.handleQRCode(qrCode)
    }
    
    // 获取用户信息
    this.getUserInfo()
    
    // 初始化WebSocket连接
    this.initSocket()
    
    // 检查是否使用自定义导航栏
    this.checkCustomNavBar()
  },

  onShow() {
    // 页面显示时重新连接
    if (this.data.conversationId) {
      this.reconnectSocket()
    }
  },

  onHide() {
    // 页面隐藏时暂停某些功能
    this.pauseTypingIndicator()
  },

  onUnload() {
    // 页面卸载时清理资源
    this.cleanup()
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      // 如果没有用户信息，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 检查自定义导航栏
  checkCustomNavBar() {
    const systemInfo = wx.getSystemInfoSync()
    const customNavBar = systemInfo.platform === 'ios' && systemInfo.version >= '7.0.0'
    this.setData({ customNavBar })
  },

  // 初始化Socket连接
  initSocket() {
    socketService.connect({
      onOpen: () => {
        console.log('Socket connected')
        this.setData({ isConnected: true })
        this.joinConversation()
      },
      onMessage: (data) => {
        this.handleSocketMessage(data)
      },
      onClose: () => {
        console.log('Socket disconnected')
        this.setData({ isConnected: false })
      },
      onError: (error) => {
        console.error('Socket error:', error)
        this.setData({ isConnected: false })
      }
    })
  },

  // 重新连接Socket
  reconnectSocket() {
    if (!this.data.isConnected) {
      this.initSocket()
    }
  },

  // 处理Socket消息
  handleSocketMessage(data) {
    const { type, payload } = data
    
    switch (type) {
      case 'message':
        this.addMessage(payload)
        break
      case 'typing':
        this.handleTypingIndicator(payload)
        break
      case 'read':
        this.updateMessageStatus(payload.messageId, 'read')
        break
      case 'staff_status':
        this.updateStaffStatus(payload)
        break
      case 'conversation_end':
        this.handleConversationEnd(payload)
        break
      default:
        console.log('Unknown message type:', type)
    }
  },

  // 加入会话
  joinConversation() {
    if (this.data.conversationId && this.data.isConnected) {
      socketService.send({
        type: 'join',
        payload: {
          conversationId: this.data.conversationId,
          userInfo: this.data.userInfo
        }
      })
    }
  },

  // 加载会话
  async loadConversation(conversationId) {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const conversation = await messageService.getConversation(conversationId)
      const messages = await messageService.getMessages(conversationId)
      
      this.setData({
        serviceStaff: conversation.serviceStaff,
        messages: messages.reverse(),
        hasMoreMessages: messages.length >= 20
      })
      
      // 滚动到底部
      this.scrollToBottom()
      
    } catch (error) {
      console.error('Load conversation failed:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 创建会话
  async createConversation(staffId) {
    try {
      wx.showLoading({ title: '连接客服...' })
      
      const conversation = await messageService.createConversation({
        staffId,
        userInfo: this.data.userInfo
      })
      
      this.setData({
        conversationId: conversation.id,
        serviceStaff: conversation.serviceStaff
      })
      
      // 发送欢迎消息
      this.addSystemMessage('已为您接入客服，请描述您的问题')
      
    } catch (error) {
      console.error('Create conversation failed:', error)
      wx.showToast({
        title: '连接失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 处理二维码
  async handleQRCode(qrCode) {
    try {
      wx.showLoading({ title: '解析二维码...' })
      
      const result = await messageService.parseQRCode(qrCode)
      
      if (result.type === 'staff') {
        this.createConversation(result.staffId)
      } else if (result.type === 'conversation') {
        this.setData({ conversationId: result.conversationId })
        this.loadConversation(result.conversationId)
      }
      
    } catch (error) {
      console.error('Parse QR code failed:', error)
      wx.showToast({
        title: '二维码无效',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 拨打电话
  makeCall() {
    if (this.data.serviceStaff.phone) {
      wx.makePhoneCall({
        phoneNumber: this.data.serviceStaff.phone
      })
    } else {
      wx.showToast({
        title: '暂无电话',
        icon: 'none'
      })
    }
  },

  // 显示更多操作
  showMore() {
    wx.showActionSheet({
      itemList: ['结束会话', '投诉建议', '分享会话'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.endConversation()
            break
          case 1:
            this.showComplaint()
            break
          case 2:
            this.shareConversation()
            break
        }
      }
    })
  },

  // 加载更多消息
  async loadMoreMessages() {
    if (this.data.loadingMore || !this.data.hasMoreMessages) {
      return
    }
    
    this.setData({ loadingMore: true })
    
    try {
      const oldestMessage = this.data.messages[0]
      const messages = await messageService.getMessages(
        this.data.conversationId,
        {
          before: oldestMessage.id,
          limit: 20
        }
      )
      
      if (messages.length > 0) {
        this.setData({
          messages: [...messages.reverse(), ...this.data.messages],
          hasMoreMessages: messages.length >= 20
        })
      } else {
        this.setData({ hasMoreMessages: false })
      }
      
    } catch (error) {
      console.error('Load more messages failed:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  // 输入框变化
  onInputChange(e) {
    const inputText = e.detail.value
    this.setData({ inputText })
    
    // 发送正在输入状态
    this.sendTypingStatus(inputText.length > 0)
  },

  // 输入框获得焦点
  onInputFocus() {
    this.setData({
      showEmoji: false,
      showMoreActions: false
    })
    
    // 延迟滚动到底部
    setTimeout(() => {
      this.scrollToBottom()
    }, 300)
  },

  // 输入框失去焦点
  onInputBlur() {
    this.sendTypingStatus(false)
  },

  // 发送正在输入状态
  sendTypingStatus(isTyping) {
    if (this.data.isConnected) {
      socketService.send({
        type: 'typing',
        payload: {
          conversationId: this.data.conversationId,
          isTyping
        }
      })
    }
  },

  // 处理正在输入指示器
  handleTypingIndicator(payload) {
    this.setData({ isTyping: payload.isTyping })
    
    if (payload.isTyping) {
      // 3秒后自动隐藏
      setTimeout(() => {
        this.setData({ isTyping: false })
      }, 3000)
    }
  },

  // 暂停正在输入指示器
  pauseTypingIndicator() {
    this.sendTypingStatus(false)
  },

  // 切换语音输入模式
  toggleVoiceInput() {
    this.setData({
      voiceMode: !this.data.voiceMode,
      showEmoji: false,
      showMoreActions: false
    })
  },

  // 切换表情面板
  toggleEmoji() {
    this.setData({
      showEmoji: !this.data.showEmoji,
      showMoreActions: false
    })
  },

  // 切换更多操作面板
  toggleMoreActions() {
    this.setData({
      showMoreActions: !this.data.showMoreActions,
      showEmoji: false
    })
  },

  // 选择表情
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji
    const inputText = this.data.inputText + emoji.char
    this.setData({ inputText })
  },

  // 发送文本消息
  async sendTextMessage() {
    const content = this.data.inputText.trim()
    if (!content) {
      return
    }
    
    // 清空输入框
    this.setData({ inputText: '' })
    
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'text',
      content,
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'text',
        content
      })
      
      // 更新消息状态
      this.updateMessageStatus(message.id, 'sent', result.id)
      
    } catch (error) {
      console.error('Send message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 开始录音
  startRecord() {
    this.setData({
      recording: true,
      recordingTime: 0,
      recordStartTime: Date.now()
    })
    
    // 开始录音计时
    this.data.recordTimer = setInterval(() => {
      const recordingTime = Math.floor((Date.now() - this.data.recordStartTime) / 1000)
      this.setData({ recordingTime })
      
      // 最长录音60秒
      if (recordingTime >= 60) {
        this.stopRecord()
      }
    }, 1000)
    
    // 开始录音
    audioService.startRecord({
      onStart: () => {
        console.log('Recording started')
      },
      onError: (error) => {
        console.error('Recording error:', error)
        this.cancelRecord()
        wx.showToast({
          title: '录音失败',
          icon: 'error'
        })
      }
    })
  },

  // 停止录音
  async stopRecord() {
    if (!this.data.recording) {
      return
    }
    
    this.setData({ recording: false })
    
    // 清除计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer)
      this.data.recordTimer = null
    }
    
    // 录音时间太短
    if (this.data.recordingTime < 1) {
      wx.showToast({
        title: '录音时间太短',
        icon: 'none'
      })
      audioService.cancelRecord()
      return
    }
    
    try {
      // 停止录音并获取文件
      const audioFile = await audioService.stopRecord()
      
      // 发送语音消息
      this.sendVoiceMessage(audioFile, this.data.recordingTime)
      
    } catch (error) {
      console.error('Stop recording failed:', error)
      wx.showToast({
        title: '录音失败',
        icon: 'error'
      })
    }
  },

  // 取消录音
  cancelRecord() {
    if (!this.data.recording) {
      return
    }
    
    this.setData({ recording: false })
    
    // 清除计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer)
      this.data.recordTimer = null
    }
    
    // 取消录音
    audioService.cancelRecord()
  },

  // 发送语音消息
  async sendVoiceMessage(audioFile, duration) {
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'voice',
      content: audioFile.tempFilePath,
      duration,
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 上传音频文件
      const uploadResult = await fileService.uploadFile(audioFile.tempFilePath, 'audio')
      
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'voice',
        content: uploadResult.url,
        duration
      })
      
      // 更新消息
      this.updateMessage(message.id, {
        content: uploadResult.url,
        status: 'sent',
        serverId: result.id
      })
      
    } catch (error) {
      console.error('Send voice message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 播放语音
  playVoice(e) {
    const voice = e.currentTarget.dataset.voice
    
    // 停止当前播放的语音
    this.stopAllVoice()
    
    // 更新播放状态
    this.updateMessage(voice.id, { playing: true })
    
    // 播放语音
    audioService.playVoice(voice.content, {
      onPlay: () => {
        console.log('Voice playing')
      },
      onStop: () => {
        this.updateMessage(voice.id, { playing: false })
      },
      onError: (error) => {
        console.error('Play voice error:', error)
        this.updateMessage(voice.id, { playing: false })
        wx.showToast({
          title: '播放失败',
          icon: 'error'
        })
      }
    })
  },

  // 停止所有语音播放
  stopAllVoice() {
    audioService.stopVoice()
    
    // 更新所有语音消息的播放状态
    const messages = this.data.messages.map(msg => {
      if (msg.messageType === 'voice') {
        return { ...msg, playing: false }
      }
      return msg
    })
    
    this.setData({ messages })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        res.tempFiles.forEach(file => {
          this.sendImageMessage(file.tempFilePath)
        })
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 选择视频
  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.sendVideoMessage(file.tempFilePath, file.duration)
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 选择文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        this.sendFileMessage(file.path, file.name, file.size)
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.sendLocationMessage(res)
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.sendImageMessage(file.tempFilePath)
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 扫码
  scanCode() {
    wx.scanCode({
      success: (res) => {
        this.sendTextMessage()
        this.setData({ inputText: res.result })
      }
    })
    
    this.setData({ showMoreActions: false })
  },

  // 发送图片消息
  async sendImageMessage(imagePath) {
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'image',
      content: imagePath,
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 上传图片
      const uploadResult = await fileService.uploadFile(imagePath, 'image')
      
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'image',
        content: uploadResult.url
      })
      
      // 更新消息
      this.updateMessage(message.id, {
        content: uploadResult.url,
        status: 'sent',
        serverId: result.id
      })
      
    } catch (error) {
      console.error('Send image message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 发送视频消息
  async sendVideoMessage(videoPath, duration) {
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'video',
      content: videoPath,
      duration,
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 上传视频
      const uploadResult = await fileService.uploadFile(videoPath, 'video')
      
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'video',
        content: uploadResult.url,
        duration
      })
      
      // 更新消息
      this.updateMessage(message.id, {
        content: uploadResult.url,
        status: 'sent',
        serverId: result.id
      })
      
    } catch (error) {
      console.error('Send video message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 发送文件消息
  async sendFileMessage(filePath, fileName, fileSize) {
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'file',
      content: filePath,
      fileName,
      fileSize: this.formatFileSize(fileSize),
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 上传文件
      const uploadResult = await fileService.uploadFile(filePath, 'file')
      
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'file',
        content: uploadResult.url,
        fileName,
        fileSize
      })
      
      // 更新消息
      this.updateMessage(message.id, {
        content: uploadResult.url,
        status: 'sent',
        serverId: result.id
      })
      
    } catch (error) {
      console.error('Send file message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 发送位置消息
  async sendLocationMessage(location) {
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      conversationId: this.data.conversationId,
      type: 'sent',
      messageType: 'location',
      locationName: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      time: this.formatTime(new Date()),
      status: 'sending'
    }
    
    // 添加到消息列表
    this.addMessage(message)
    
    try {
      // 发送消息
      const result = await messageService.sendMessage({
        conversationId: this.data.conversationId,
        type: 'location',
        content: {
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude
        }
      })
      
      // 更新消息状态
      this.updateMessageStatus(message.id, 'sent', result.id)
      
    } catch (error) {
      console.error('Send location message failed:', error)
      this.updateMessageStatus(message.id, 'failed')
    }
  },

  // 预览图片
  previewImage(e) {
    const src = e.currentTarget.dataset.src
    const urls = e.currentTarget.dataset.urls || [src]
    
    wx.previewImage({
      current: src,
      urls
    })
  },

  // 下载文件
  downloadFile(e) {
    const file = e.currentTarget.dataset.file
    
    wx.downloadFile({
      url: file.content,
      success: (res) => {
        wx.openDocument({
          filePath: res.tempFilePath,
          success: () => {
            console.log('Open document success')
          },
          fail: (error) => {
            console.error('Open document failed:', error)
            wx.showToast({
              title: '打开失败',
              icon: 'error'
            })
          }
        })
      },
      fail: (error) => {
        console.error('Download file failed:', error)
        wx.showToast({
          title: '下载失败',
          icon: 'error'
        })
      }
    })
  },

  // 打开位置
  openLocation(e) {
    const location = e.currentTarget.dataset.location
    
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.locationName,
      address: location.address
    })
  },

  // 显示消息菜单
  showMessageMenu(e) {
    const message = e.currentTarget.dataset.message
    this.setData({
      showMessageMenu: true,
      selectedMessage: message
    })
  },

  // 隐藏消息菜单
  hideMessageMenu() {
    this.setData({
      showMessageMenu: false,
      selectedMessage: null
    })
  },

  // 复制消息
  copyMessage() {
    const message = this.data.selectedMessage
    if (message && message.messageType === 'text') {
      wx.setClipboardData({
        data: message.content,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          })
        }
      })
    }
    this.hideMessageMenu()
  },

  // 转发消息
  forwardMessage() {
    const message = this.data.selectedMessage
    // TODO: 实现转发功能
    console.log('Forward message:', message)
    this.hideMessageMenu()
  },

  // 删除消息
  async deleteMessage() {
    const message = this.data.selectedMessage
    
    try {
      await messageService.deleteMessage(message.serverId || message.id)
      
      // 从消息列表中移除
      const messages = this.data.messages.filter(msg => msg.id !== message.id)
      this.setData({ messages })
      
      wx.showToast({
        title: '已删除',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('Delete message failed:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
    
    this.hideMessageMenu()
  },

  // 撤回消息
  async recallMessage() {
    const message = this.data.selectedMessage
    
    try {
      await messageService.recallMessage(message.serverId || message.id)
      
      // 更新消息为撤回状态
      this.updateMessage(message.id, {
        messageType: 'system',
        content: '你撤回了一条消息',
        recalled: true
      })
      
      wx.showToast({
        title: '已撤回',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('Recall message failed:', error)
      wx.showToast({
        title: '撤回失败',
        icon: 'error'
      })
    }
    
    this.hideMessageMenu()
  },

  // 重新连接
  reconnect() {
    this.initSocket()
  },

  // 结束会话
  endConversation() {
    wx.showModal({
      title: '结束会话',
      content: '确定要结束当前会话吗？',
      success: (res) => {
        if (res.confirm) {
          this.doEndConversation()
        }
      }
    })
  },

  // 执行结束会话
  async doEndConversation() {
    try {
      await messageService.endConversation(this.data.conversationId)
      
      // 添加系统消息
      this.addSystemMessage('会话已结束')
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('End conversation failed:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  // 显示投诉
  showComplaint() {
    wx.navigateTo({
      url: `/pages/complaint/complaint?conversationId=${this.data.conversationId}`
    })
  },

  // 分享会话
  shareConversation() {
    // TODO: 实现分享功能
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 处理会话结束
  handleConversationEnd(payload) {
    this.addSystemMessage(payload.message || '会话已结束')
    
    // 禁用输入
    this.setData({
      inputDisabled: true,
      showEmoji: false,
      showMoreActions: false
    })
  },

  // 更新客服状态
  updateStaffStatus(payload) {
    this.setData({
      'serviceStaff.status': payload.status,
      'serviceStaff.statusText': payload.statusText
    })
  },

  // 添加消息
  addMessage(message) {
    const messages = [...this.data.messages, message]
    this.setData({ messages })
    this.scrollToBottom()
  },

  // 添加系统消息
  addSystemMessage(content) {
    const message = {
      id: this.generateMessageId(),
      type: 'system',
      content,
      time: this.formatTime(new Date())
    }
    this.addMessage(message)
  },

  // 更新消息状态
  updateMessageStatus(messageId, status, serverId) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        const updates = { status }
        if (serverId) {
          updates.serverId = serverId
        }
        return { ...msg, ...updates }
      }
      return msg
    })
    this.setData({ messages })
  },

  // 更新消息
  updateMessage(messageId, updates) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, ...updates }
      }
      return msg
    })
    this.setData({ messages })
  },

  // 滚动到底部
  scrollToBottom() {
    const messages = this.data.messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      this.setData({
        scrollIntoView: `msg-${lastMessage.id}`
      })
    }
  },

  // 生成消息ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = date.getHours()
      const minute = date.getMinutes()
      
      return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // 清理资源
  cleanup() {
    // 停止录音
    if (this.data.recording) {
      this.cancelRecord()
    }
    
    // 停止语音播放
    this.stopAllVoice()
    
    // 断开Socket连接
    socketService.disconnect()
    
    // 清除定时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer)
      this.data.recordTimer = null
    }
  }
})