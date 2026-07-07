/**
 * custom-tab-bar/index.js
 * ===================================================================
 * 校园易物 · 自定义底部导航栏（v7 极简重构版）
 *   - 移除灵动岛、形状变形、呼吸光晕等复杂逻辑
 *   - 仅保留：选中态同步、徽标管理、沉浸态切换
 *   - 父页面继续通过 this.getTabBar().setData({ selected: idx }) 同步高亮
 *
 * 数据流兼容：
 *   - data.selected        当前选中的 tab 索引
 *   - data.list            5 tab 列表
 *   - data.immersive       沉浸态
 *   - list[].badge         数字徽标
 */

const ICON_BASE = '/assets/tabbar/'

/**
 * 构造默认 5 项 tab 列表
 * @returns {Array<{key:string,text:string,pagePath:string,icon:string,iconActive:string,isCenter?:boolean,badge:number}>}
 */
function buildDefaultList() {
  return [
    {
      key: 'home',
      text: '首页',
      pagePath: '/pages/index/index',
      icon: ICON_BASE + 'home.png',
      iconActive: ICON_BASE + 'home-active.png',
      badge: 0,
    },
    {
      key: 'category',
      text: '分类',
      pagePath: '/pages/category/category',
      icon: ICON_BASE + 'category.png',
      iconActive: ICON_BASE + 'category-active.png',
      badge: 0,
    },
    {
      key: 'publish',
      text: '发布',
      pagePath: '/pages/publish/publish',
      icon: ICON_BASE + 'publish.png',
      iconActive: ICON_BASE + 'publish-active.png',
      isCenter: true,
      badge: 0,
    },
    {
      key: 'chat',
      text: '消息',
      pagePath: '/pages/chat/chat',
      icon: ICON_BASE + 'chat.png',
      iconActive: ICON_BASE + 'chat-active.png',
      badge: 0,
    },
    {
      key: 'mine',
      text: '我的',
      pagePath: '/pages/mine/mine',
      icon: ICON_BASE + 'mine.png',
      iconActive: ICON_BASE + 'mine-active.png',
      badge: 0,
    },
  ]
}

Component({
  data: {
    /** 当前选中的 tab 索引（由父页面 setData 同步） */
    selected: 0,
    /** 5 tab 列表：首页 / 分类 / 发布 / 消息 / 我的 */
    list: buildDefaultList(),
    /** 沉浸态：true 时整个 tab-bar-root 向下淡出 */
    immersive: false,
  },

  lifetimes: {
    /**
     * 组件挂载
     */
    attached() {},

    /**
     * 组件卸载
     */
    detached() {},
  },

  methods: {
    /**
     * 点击 tab：切换页面
     * @param {Object} e 事件对象
     * @returns {void}
     */
    onTap(e) {
      const index = e.currentTarget.dataset.index
      if (index === this.data.selected) return
      const url = this.data.list[index].pagePath
      wx.switchTab({ url })
    },

    /**
     * 兼容旧版 switchTab
     * @param {Object} e 事件对象
     * @returns {void}
     */
    switchTab(e) {
      return this.onTap(e)
    },

    /**
     * 设置某 tab 的数字徽标
     * @param {string} key home|category|publish|chat|mine
     * @param {number} n 数字（<=0 表示隐藏）
     * @returns {void}
     */
    setBadge(key, n) {
      const idx = this.data.list.findIndex((it) => it.key === key)
      if (idx === -1) return
      const target = `list[${idx}].badge`
      this.setData({ [target]: Math.max(0, Number(n) || 0) })
    },

    /**
     * 增加某 tab 的数字徽标
     * @param {string} key tab 标识
     * @param {number} [delta=1] 增量
     * @returns {void}
     */
    incBadge(key, delta = 1) {
      const idx = this.data.list.findIndex((it) => it.key === key)
      if (idx === -1) return
      const cur = this.data.list[idx].badge || 0
      this.setBadge(key, cur + delta)
    },

    /**
     * 清除某 tab 的数字徽标
     * @param {string} key tab 标识
     * @returns {void}
     */
    clearBadge(key) {
      this.setBadge(key, 0)
    },

    /**
     * 切换沉浸态
     * @param {boolean} immersive true 隐藏 / false 显示
     * @returns {Promise<void>}
     */
    setImmersive(immersive) {
      const target = !!immersive
      if (this.data.immersive === target) return Promise.resolve()
      this.setData({ immersive: target })
    },

    /**
     * 显示 Now Bar（兼容旧 API · v7 已移除灵动岛，仅保留空实现）
     * @returns {void}
     */
    showNowBar() {},

    /**
     * 隐藏 Now Bar（兼容旧 API · v7 已移除灵动岛）
     * @returns {void}
     */
    hideNowBar() {},
  },
})
