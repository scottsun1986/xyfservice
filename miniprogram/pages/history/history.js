// pages/history/history.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'all',
    showSearchBox: false,
    searchValue: '',
    loading: false,
    historyList: [],
    filteredList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadHistoryData();
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
    // 每次显示页面时刷新数据
    this.loadHistoryData();
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
    this.loadHistoryData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 加载更多数据
    this.loadMoreData();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '咨询历史',
      path: '/pages/history/history'
    };
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterList();
  },

  /**
   * 显示搜索框
   */
  showSearch() {
    this.setData({
      showSearchBox: true
    });
  },

  /**
   * 隐藏搜索框
   */
  hideSearch() {
    this.setData({
      showSearchBox: false,
      searchValue: ''
    });
    this.filterList();
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value
    });
    this.filterList();
  },

  /**
   * 筛选列表
   */
  filterList() {
    const { historyList, activeTab, searchValue } = this.data;
    let filtered = [...historyList];

    // 按状态筛选
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.status === activeTab);
    }

    // 按搜索关键词筛选
    if (searchValue.trim()) {
      const keyword = searchValue.trim().toLowerCase();
      filtered = filtered.filter(item => 
        item.staffName.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        item.lastMessage.toLowerCase().includes(keyword)
      );
    }

    this.setData({
      filteredList: filtered
    });
  },

  /**
   * 打开聊天页面
   */
  openChat(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/chat/chat?consultationId=${id}`
    });
  },

  /**
   * 继续咨询
   */
  continueChat(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/chat/chat?consultationId=${id}&continue=true`
    });
  },

  /**
   * 查看详情
   */
  viewDetails(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const item = this.data.historyList.find(h => h.id === id);
    
    if (item) {
      wx.showModal({
        title: '咨询详情',
        content: `咨询类型：${item.category}\n客服：${item.staffName}\n创建时间：${item.createTime}\n状态：${item.statusText}${item.duration ? '\n咨询时长：' + item.duration : ''}`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  /**
   * 跳转到咨询页面
   */
  goToConsultation() {
    wx.switchTab({
      url: '/pages/consultation/consultation'
    });
  },

  /**
   * 加载历史数据
   */
  loadHistoryData() {
    this.setData({ loading: true });

    // 模拟数据，实际应该从服务器获取
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          staffName: '客服小王',
          staffAvatar: '/images/avatar1.png',
          category: '产品咨询',
          status: 'ongoing',
          statusText: '进行中',
          lastMessage: '好的，我来为您详细介绍一下我们的产品功能...',
          lastMessageTime: '2024-01-15 14:30',
          createTime: '2024-01-15 14:00',
          duration: null
        },
        {
          id: 2,
          staffName: '客服小李',
          staffAvatar: '/images/avatar2.png',
          category: '技术支持',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '问题已经解决，感谢您的咨询！',
          lastMessageTime: '2024-01-14 16:45',
          createTime: '2024-01-14 15:30',
          duration: '1小时15分钟'
        },
        {
          id: 3,
          staffName: '客服小张',
          staffAvatar: '/images/avatar3.png',
          category: '售后服务',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '您的退货申请已经处理完成，请注意查收。',
          lastMessageTime: '2024-01-13 10:20',
          createTime: '2024-01-13 09:00',
          duration: '45分钟'
        },
        {
          id: 4,
          staffName: '客服小赵',
          staffAvatar: '/images/avatar4.png',
          category: '账户问题',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '您的账户问题已经解决，可以正常使用了。',
          lastMessageTime: '2024-01-12 11:30',
          createTime: '2024-01-12 11:00',
          duration: '30分钟'
        }
      ];

      this.setData({
        historyList: mockData,
        loading: false
      });
      this.filterList();
    }, 1000);
  },

  /**
   * 加载更多数据
   */
  loadMoreData() {
    // 实际项目中这里应该实现分页加载
    console.log('加载更多历史记录');
  }
});