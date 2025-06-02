// pages/consultation/consultation.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchValue: '',
    categories: [
      {
        id: 1,
        name: '产品咨询',
        icon: '/images/icon_product.png'
      },
      {
        id: 2,
        name: '技术支持',
        icon: '/images/icon_tech.png'
      },
      {
        id: 3,
        name: '售后服务',
        icon: '/images/icon_service.png'
      },
      {
        id: 4,
        name: '账户问题',
        icon: '/images/icon_account.png'
      },
      {
        id: 5,
        name: '订单查询',
        icon: '/images/icon_order.png'
      },
      {
        id: 6,
        name: '投诉建议',
        icon: '/images/icon_feedback.png'
      },
      {
        id: 7,
        name: '退换货',
        icon: '/images/icon_return.png'
      },
      {
        id: 8,
        name: '其他问题',
        icon: '/images/icon_other.png'
      }
    ],
    faqList: [
      {
        id: 1,
        question: '如何注册账户？',
        answer: '您可以通过微信授权登录，或使用手机号注册账户。'
      },
      {
        id: 2,
        question: '忘记密码怎么办？',
        answer: '点击登录页面的"忘记密码"，通过手机验证码重置密码。'
      },
      {
        id: 3,
        question: '如何联系客服？',
        answer: '您可以通过在线客服、电话客服或留言的方式联系我们。'
      },
      {
        id: 4,
        question: '订单多久能发货？',
        answer: '一般情况下，订单会在24小时内发货，节假日可能会有延迟。'
      },
      {
        id: 5,
        question: '支持哪些支付方式？',
        answer: '支持微信支付、支付宝、银行卡等多种支付方式。'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的分类ID，直接跳转到对应分类
    if (options.categoryId) {
      this.onCategoryTap({ currentTarget: { dataset: { id: options.categoryId } } });
    }
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
    // 刷新数据
    this.loadData();
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
      title: '客服咨询',
      path: '/pages/consultation/consultation'
    };
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  /**
   * 分类点击处理
   */
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item.id === categoryId);
    
    if (category) {
      // 跳转到聊天页面，并传递分类信息
      wx.navigateTo({
        url: `/pages/chat/chat?type=category&categoryId=${categoryId}&categoryName=${category.name}`
      });
    }
  },

  /**
   * 常见问题点击处理
   */
  onFaqTap(e) {
    const faqId = e.currentTarget.dataset.id;
    const faq = this.data.faqList.find(item => item.id === faqId);
    
    if (faq) {
      wx.showModal({
        title: faq.question,
        content: faq.answer,
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  },

  /**
   * 开始聊天
   */
  startChat() {
    wx.navigateTo({
      url: '/pages/chat/chat?type=general'
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
   * 加载数据
   */
  loadData() {
    // 这里可以从服务器加载最新的分类和FAQ数据
    console.log('加载咨询数据');
  }
});