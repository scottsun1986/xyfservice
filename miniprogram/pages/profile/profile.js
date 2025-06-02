// pages/profile/profile.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    stats: {
      totalConsultations: 0,
      ongoingConsultations: 0,
      completedConsultations: 0
    },
    showEditModal: false,
    editForm: {
      nickName: '',
      phone: ''
    },
    version: '1.0.0'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
    this.loadUserStats();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示时刷新用户信息和统计数据
    this.loadUserInfo();
    this.loadUserStats();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    this.loadUserInfo();
    this.loadUserStats();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '客服咨询系统',
      path: '/pages/index/index'
    };
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  /**
   * 加载用户统计数据
   */
  loadUserStats() {
    // 模拟数据，实际应该从服务器获取
    setTimeout(() => {
      this.setData({
        stats: {
          totalConsultations: 12,
          ongoingConsultations: 1,
          completedConsultations: 11
        }
      });
    }, 500);
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    if (!this.data.userInfo.nickName) {
      this.login();
      return;
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 这里应该上传到服务器，然后更新用户头像
        this.updateUserInfo({ avatarUrl: tempFilePath });
      },
      fail: (err) => {
        console.error('选择头像失败:', err);
      }
    });
  },

  /**
   * 登录
   */
  login() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.updateUserInfo(userInfo);
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('登录失败:', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 编辑资料
   */
  editProfile() {
    if (!this.data.userInfo.nickName) {
      this.login();
      return;
    }

    this.setData({
      showEditModal: true,
      editForm: {
        nickName: this.data.userInfo.nickName || '',
        phone: this.data.userInfo.phone || ''
      }
    });
  },

  /**
   * 隐藏编辑弹窗
   */
  hideEditModal() {
    this.setData({ showEditModal: false });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  /**
   * 昵称输入
   */
  onNickNameInput(e) {
    this.setData({
      'editForm.nickName': e.detail.value
    });
  },

  /**
   * 手机号输入
   */
  onPhoneInput(e) {
    this.setData({
      'editForm.phone': e.detail.value
    });
  },

  /**
   * 保存资料
   */
  saveProfile() {
    const { nickName, phone } = this.data.editForm;
    
    if (!nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    // 更新用户信息
    this.updateUserInfo({
      nickName: nickName.trim(),
      phone: phone
    });

    this.hideEditModal();
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(newInfo) {
    const userInfo = { ...this.data.userInfo, ...newInfo };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  /**
   * 跳转到历史页面
   */
  goToHistory(e) {
    const tab = e.currentTarget.dataset.tab;
    const url = tab ? `/pages/history/history?tab=${tab}` : '/pages/history/history';
    wx.switchTab({
      url: '/pages/history/history'
    });
  },

  /**
   * 跳转到意见反馈
   */
  goToFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈，我们会认真对待每一条建议。您可以通过在线客服或邮件联系我们。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 跳转到设置
   */
  goToSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存', '消息通知设置', '隐私设置'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.clearCache();
            break;
          case 1:
            this.notificationSettings();
            break;
          case 2:
            this.privacySettings();
            break;
        }
      }
    });
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
          // 重新加载用户信息
          this.loadUserInfo();
        }
      }
    });
  },

  /**
   * 消息通知设置
   */
  notificationSettings() {
    wx.showModal({
      title: '消息通知',
      content: '您可以在系统设置中管理小程序的通知权限。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 隐私设置
   */
  privacySettings() {
    wx.showModal({
      title: '隐私设置',
      content: '我们严格保护您的隐私信息，详细的隐私政策请查看关于我们页面。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 跳转到帮助中心
   */
  goToHelp() {
    wx.showModal({
      title: '帮助中心',
      content: '常见问题：\n1. 如何开始咨询？\n2. 如何查看历史记录？\n3. 如何联系客服？\n\n更多帮助请联系在线客服。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 跳转到关于我们
   */
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '客服咨询系统 v1.0.0\n\n为用户提供便捷的在线客服服务，支持实时聊天、历史记录查看等功能。\n\n技术支持：开发团队\n联系邮箱：support@example.com',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          this.setData({
            userInfo: {},
            stats: {
              totalConsultations: 0,
              ongoingConsultations: 0,
              completedConsultations: 0
            }
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});