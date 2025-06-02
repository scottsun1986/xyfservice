// pages/index/index.js

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 自定义导航栏
    customNavBar: true,
    
    // 服务状态
    serviceStatus: 'online', // online, offline
    serviceStatusText: '客服在线，随时为您服务',
    currentTime: '',
    
    // 加载状态
    loading: false,
    loadingText: '正在连接...',
    
    // 客服选择弹窗
    showStaffModal: false,
    staffList: [
      {
        id: 1,
        name: '小王',
        avatar: '/images/staff-1.png',
        description: '专业客服，5年经验',
        status: 'online',
        statusText: '在线'
      },
      {
        id: 2,
        name: '小李',
        avatar: '/images/staff-2.png',
        description: '高级客服，擅长技术问题',
        status: 'busy',
        statusText: '忙碌中'
      },
      {
        id: 3,
        name: '小张',
        avatar: '/images/staff-3.png',
        description: '资深客服，10年经验',
        status: 'offline',
        statusText: '离线'
      }
    ],
    
    // 用户信息
    userInfo: null,
    hasUserInfo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载', options);
    
    // 检查用户授权状态
    this.checkUserAuth();
    
    // 获取服务状态
    this.getServiceStatus();
    
    // 更新当前时间
    this.updateCurrentTime();
    
    // 定时更新时间
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 60000); // 每分钟更新一次
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新服务状态
    this.getServiceStatus();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  /**
   * 检查用户授权状态
   */
  checkUserAuth() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    // 模拟API调用
    wx.request({
      url: 'https://api.example.com/service/status',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const { status, message } = res.data;
          this.setData({
            serviceStatus: status,
            serviceStatusText: message
          });
        }
      },
      fail: (err) => {
        console.error('获取服务状态失败:', err);
        // 使用默认状态
        this.setData({
          serviceStatus: 'online',
          serviceStatusText: '客服在线，随时为您服务'
        });
      }
    });
  },

  /**
   * 更新当前时间
   */
  updateCurrentTime() {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.setData({
      currentTime: timeStr
    });
  },

  /**
   * 扫码咨询
   */
  scanQRCode() {
    console.log('扫码咨询');
    
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        console.log('扫码结果:', res);
        
        // 解析二维码内容
        const qrData = this.parseQRCode(res.result);
        
        if (qrData && qrData.type === 'customer_service') {
          // 跳转到聊天页面
          wx.navigateTo({
            url: `/pages/chat/chat?staffId=${qrData.staffId}&source=qrcode`
          });
        } else {
          wx.showToast({
            title: '无效的客服二维码',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        if (err.errMsg.includes('cancel')) {
          // 用户取消扫码
          return;
        }
        wx.showToast({
          title: '扫码失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 解析二维码内容
   */
  parseQRCode(qrContent) {
    try {
      // 尝试解析JSON格式
      const data = JSON.parse(qrContent);
      return data;
    } catch (e) {
      // 尝试解析URL格式
      if (qrContent.includes('staffId=')) {
        const url = new URL(qrContent);
        const staffId = url.searchParams.get('staffId');
        return {
          type: 'customer_service',
          staffId: staffId
        };
      }
      return null;
    }
  },

  /**
   * 开始聊天
   */
  startChat() {
    console.log('开始聊天');
    
    // 检查用户授权
    if (!this.data.hasUserInfo) {
      this.getUserProfile();
      return;
    }
    
    // 显示客服选择弹窗
    this.setData({
      showStaffModal: true
    });
  },

  /**
   * 查看历史记录
   */
  viewHistory() {
    console.log('查看历史记录');
    
    // 检查用户授权
    if (!this.data.hasUserInfo) {
      this.getUserProfile();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  /**
   * 查看常见问题
   */
  viewFAQ() {
    console.log('查看常见问题');
    
    wx.navigateTo({
      url: '/pages/faq/faq'
    });
  },

  /**
   * 快速操作
   */
  quickAction(e) {
    const action = e.currentTarget.dataset.action;
    console.log('快速操作:', action);
    
    switch (action) {
      case 'complaint':
        this.handleComplaint();
        break;
      case 'feedback':
        this.handleFeedback();
        break;
      case 'contact':
        this.handleContact();
        break;
      case 'about':
        this.handleAbout();
        break;
      default:
        console.log('未知操作:', action);
    }
  },

  /**
   * 处理投诉建议
   */
  handleComplaint() {
    wx.navigateTo({
      url: '/pages/complaint/complaint'
    });
  },

  /**
   * 处理意见反馈
   */
  handleFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  /**
   * 处理联系我们
   */
  handleContact() {
    wx.showModal({
      title: '联系我们',
      content: '客服热线：400-123-4567\n工作时间：周一至周日 9:00-21:00',
      showCancel: true,
      cancelText: '取消',
      confirmText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          this.makeCall();
        }
      }
    });
  },

  /**
   * 处理关于我们
   */
  handleAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  /**
   * 拨打电话
   */
  makeCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: (err) => {
        console.error('拨打电话失败:', err);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 获取用户信息
   */
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        const userInfo = res.userInfo;
        
        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        
        wx.showToast({
          title: '授权成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 隐藏客服选择弹窗
   */
  hideStaffModal() {
    this.setData({
      showStaffModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 选择客服
   */
  selectStaff(e) {
    const staff = e.currentTarget.dataset.staff;
    console.log('选择客服:', staff);
    
    if (staff.status !== 'online') {
      wx.showToast({
        title: '该客服暂不可用',
        icon: 'none'
      });
      return;
    }
    
    // 隐藏弹窗
    this.hideStaffModal();
    
    // 显示加载状态
    this.setData({
      loading: true,
      loadingText: '正在连接客服...'
    });
    
    // 模拟连接延迟
    setTimeout(() => {
      this.setData({
        loading: false
      });
      
      // 跳转到聊天页面
      wx.navigateTo({
        url: `/pages/chat/chat?staffId=${staff.id}&staffName=${staff.name}&source=manual`
      });
    }, 1500);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    
    // 刷新服务状态
    this.getServiceStatus();
    
    // 停止下拉刷新
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '客服助手 - 专业的客服咨询服务',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    };
  },

  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '客服助手 - 专业的客服咨询服务',
      imageUrl: '/images/share-cover.png'
    };
  }
});