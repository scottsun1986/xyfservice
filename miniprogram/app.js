// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
        this.getOpenId(res.code)
      }
    })
  },

  onShow() {
    // 小程序启动，或从后台进入前台显示时
    console.log('小程序显示')
  },

  onHide() {
    // 小程序从前台进入后台时
    console.log('小程序隐藏')
  },

  onError(msg) {
    console.log('小程序错误', msg)
  },

  // 获取用户openId
  getOpenId(code) {
    wx.request({
      url: this.globalData.baseUrl + '/api/auth/login',
      method: 'POST',
      data: {
        code: code
      },
      success: (res) => {
        if (res.data.success) {
          this.globalData.openId = res.data.data.openId
          this.globalData.sessionKey = res.data.data.sessionKey
          wx.setStorageSync('openId', res.data.data.openId)
          wx.setStorageSync('sessionKey', res.data.data.sessionKey)
        }
      },
      fail: (err) => {
        console.error('获取openId失败', err)
      }
    })
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          wx.setStorageSync('userInfo', res.userInfo)
          resolve(res.userInfo)
        },
        fail: reject
      })
    })
  },

  // 检查消息订阅权限
  checkSubscribePermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          resolve(res.subscriptionsSetting)
        },
        fail: reject
      })
    })
  },

  // 请求消息订阅
  requestSubscribeMessage(templateId) {
    return new Promise((resolve, reject) => {
      wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: (res) => {
          if (res[templateId] === 'accept') {
            console.log('用户同意订阅消息')
            resolve(true)
          } else {
            console.log('用户拒绝订阅消息')
            resolve(false)
          }
        },
        fail: reject
      })
    })
  },

  globalData: {
    userInfo: null,
    openId: null,
    sessionKey: null,
    baseUrl: 'https://your-domain.com', // 后端服务地址
    socketUrl: 'wss://your-domain.com', // WebSocket地址
    templateId: 'your-template-id', // 消息模板ID
    currentConsultation: null // 当前咨询会话
  }
})