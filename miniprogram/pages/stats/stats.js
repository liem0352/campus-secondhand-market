const api = require('../../utils/api')
// 集中管理本页所用 SVG 图标（用户规则 5：严禁 emoji / 特殊字符作 UI 图标）
const { ICON } = require('../../utils/icon.js')

// 分类占比配色（饼图与柱状图共用）
// 校园易物 v2：以橘色为主轴，辅以协调的辅助色
const CATEGORY_COLORS = [
  '#ff6b35', '#ffa500', '#07c160', '#13c2c2',
  '#722ed1', '#eb2f96', '#fa541c', '#a0d911',
  '#2f54eb', '#5b8ff9',
]

// 成员柱状图配色：橘色渐变
const BAR_COLORS = [
  '#ff6b35', '#ff8a5b', '#ffb087', '#ffd0bd', '#ffe5da',
]

/**
 * 获取 Canvas 2D 节点 + 上下文（用 boundingClientRect 拿尺寸，最稳）
 * @param {string} id wxml 中 canvas 的 id
 * @returns {Promise<{canvas, ctx, dpr, cssWidth, cssHeight}>}
 */
function getCanvasContext(id) {
  return new Promise((resolve, reject) => {
    // 第一步：用 boundingClientRect 拿 CSS 尺寸
    const q1 = wx.createSelectorQuery()
    q1
      .select('#' + id)
      .boundingClientRect()
      .exec((rectRes) => {
        if (!rectRes || !rectRes[0]) {
          reject(new Error('Canvas 节点未找到: ' + id))
          return
        }
        const rect = rectRes[0]
        if (!rect.width || !rect.height || rect.width < 10 || rect.height < 10) {
          reject(new Error('Canvas 布局未完成: ' + id + ' ' + rect.width + 'x' + rect.height))
          return
        }
        // 第二步：拿 node 对象
        const q2 = wx.createSelectorQuery()
        q2
          .select('#' + id)
          .fields({ node: true })
          .exec((nodeRes) => {
            if (!nodeRes || !nodeRes[0] || !nodeRes[0].node) {
              reject(new Error('Canvas node 未找到: ' + id))
              return
            }
            const canvas = nodeRes[0].node
            const ctx = canvas.getContext('2d')
            const dpr = sys.getSystemInfoSync().pixelRatio
            // 手动设置物理像素 = CSS 像素 * dpr
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            // 缩放坐标系，让所有绘制用 CSS 像素即可
            ctx.scale(dpr, dpr)
            resolve({ canvas, ctx, dpr, cssWidth: rect.width, cssHeight: rect.height })
          })
      })
  })
}

/**
 * 延迟指定毫秒
 */
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

Page({
  data: {
    month: '',
    monthly: {},
    categoryBars: [],   // 饼图数据
    topCategories: [],  // 柱状图 Top5
    memberBars: [],     // 成员贡献
    trendPoints: [],    // 折线图数据点
    weeklyTotal: '0',
    weeklyAvg: '0',
    weeklyMax: '0',
    // SVG 图标资源（取代 emoji / 特殊字符作 UI 图标，用户规则 5）
    iconArrowRight: ICON.arrowRight, // 月份选择器右侧箭头
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    if (!getApp().globalData.token) {
      // 用 navigateTo 而非 redirectTo：保留页面栈，让 login 页能"返回"
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    const d = new Date()
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    this.setData({ month })
    this.load(month)
  },

  onReady() {
    // 页面 ready 时尝试一次绘制（如果 load 已完成）
    setTimeout(() => this.drawAll(), 200)
  },

  async load(month) {
    try {
      // 计算本周开始日期（周一）
      const weekStart = this.getWeekStart(new Date())

      // 并行请求 monthly + weekly
      const [monthlyRes, weeklyRes] = await Promise.all([
        api.statsMonthly(month).catch(() => ({ data: {} })),
        api.statsWeekly(weekStart).catch(() => ({ data: {} })),
      ])
      const monthly = monthlyRes.data || {}
      const weekly = weeklyRes.data || {}

      const categoryBars = this.buildCategoryBars(monthly.by_category)
      const topCategories = categoryBars.slice(0, 5) // Top 5
      const memberBars = this.buildMemberBars(monthly.by_member)
      const trendPoints = this.buildTrendPoints(weekly.daily_trend)

      this.setData({
        monthly,
        categoryBars,
        topCategories,
        memberBars,
        trendPoints,
        weeklyTotal: weekly.total_expense || '0',
        weeklyAvg: this.calcAvg(weekly.daily_trend),
        weeklyMax: this.calcMax(weekly.daily_trend),
      }, () => {
        // 数据更新后稍等片刻让 Canvas 完成布局再画
        setTimeout(() => this.drawAll(), 200)
      })
    } catch (e) {
      console.error(e)
    }
  },

  /**
   * 绘制所有 Canvas（无递归，单次执行）
   * 每个图独立 try/catch，单图失败不影响其他图
   */
  async drawAll() {
    if (this._drawing) return
    this._drawing = true
    if (this.data.categoryBars.length) {
      try { await this.drawPie() } catch (e) { console.log('[drawPie]', e.message) }
    }
    if (this.data.trendPoints.length) {
      try { await this.drawLine() } catch (e) { console.log('[drawLine]', e.message) }
    }
    if (this.data.topCategories.length) {
      try { await this.drawBars() } catch (e) { console.log('[drawBars]', e.message) }
    }
    this._drawing = false
  },

  onMonth(e) {
    const month = e.detail.value.slice(0, 7)
    this.setData({ month })
    this.load(month)
  },

  // ========== 数据构建 ==========

  buildCategoryBars(byCategory) {
    if (!byCategory || !byCategory.length) return []
    return byCategory.map((c, idx) => ({
      name: c.name,
      amount: c.amount,
      percent: parseFloat(c.percent) || 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
  },

  buildMemberBars(byMember) {
    if (!byMember || !byMember.length) return []
    const max = byMember.reduce((m, x) => Math.max(m, parseFloat(x.expense) || 0), 0)
    if (max === 0) {
      return byMember.map((m, i) => ({
        nickname: m.nickname,
        expense: m.expense,
        percent: 0,
        color: BAR_COLORS[i % BAR_COLORS.length],
      }))
    }
    return byMember
      .filter((m) => parseFloat(m.expense) > 0)
      .sort((a, b) => parseFloat(b.expense) - parseFloat(a.expense))
      .map((m, i) => ({
        nickname: m.nickname,
        expense: m.expense,
        percent: Math.round((parseFloat(m.expense) / max) * 100),
        color: BAR_COLORS[i % BAR_COLORS.length],
      }))
  },

  buildTrendPoints(dailyTrend) {
    if (!dailyTrend || !dailyTrend.length) return []
    return dailyTrend.map((d) => {
      const date = new Date(d.date)
      const day = `${date.getMonth() + 1}/${date.getDate()}`
      return {
        date: d.date,
        label: day,
        value: parseFloat(d.expense) || 0,
      }
    })
  },

  calcAvg(dailyTrend) {
    if (!dailyTrend || !dailyTrend.length) return '0'
    const sum = dailyTrend.reduce((s, d) => s + (parseFloat(d.expense) || 0), 0)
    return (sum / dailyTrend.length).toFixed(2)
  },

  calcMax(dailyTrend) {
    if (!dailyTrend || !dailyTrend.length) return '0'
    return dailyTrend.reduce((m, d) => Math.max(m, parseFloat(d.expense) || 0), 0).toFixed(2)
  },

  getWeekStart(d) {
    const day = d.getDay() || 7 // 周日返回 0，转 7
    const diff = day - 1 // 与周一的差
    const monday = new Date(d)
    monday.setDate(d.getDate() - diff)
    return monday.toISOString().slice(0, 10)
  },

  // ========== Canvas 绘制：饼图 ==========

  async drawPie() {
    const { ctx, cssWidth, cssHeight } = await getCanvasContext('pieCanvas')
    const data = this.data.categoryBars
    if (!data.length) return

    ctx.clearRect(0, 0, cssWidth, cssHeight)

    // 画环形饼图
    const cx = cssWidth / 2
    const cy = cssHeight / 2
    const radius = Math.min(cssWidth, cssHeight) / 2 - 12
    const innerR = radius * 0.55 // 中心空心

    // 把 percent 累加画扇形
    let acc = 0
    const totalPct = data.reduce((s, x) => s + x.percent, 0)
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const sweep = (item.percent / (totalPct || 100)) * Math.PI * 2
      const startAngle = acc - Math.PI / 2
      const endAngle = acc + sweep - Math.PI / 2

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      acc += sweep
    }

    // 中心镂空（画白色圆覆盖）
    ctx.beginPath()
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // 中心文字
    ctx.fillStyle = '#999999'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('总支出', cx, cy - 10)

    ctx.fillStyle = '#1f1f1f'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('¥' + (this.data.monthly.total_expense || '0'), cx, cy + 12)
  },

  // ========== Canvas 绘制：折线图 ==========

  async drawLine() {
    const { ctx, cssWidth, cssHeight } = await getCanvasContext('lineCanvas')
    const points = this.data.trendPoints
    if (!points.length) return

    ctx.clearRect(0, 0, cssWidth, cssHeight)

    const padL = 36
    const padR = 16
    const padT = 24
    const padB = 36
    const chartW = cssWidth - padL - padR
    const chartH = cssHeight - padT - padB

    // 找最大值（向上取整 100 的倍数，留 10% 顶部余量）
    const maxVal = Math.max(...points.map((p) => p.value), 1)
    const yMax = Math.ceil(maxVal * 1.1 / 100) * 100 || 100

    // 画 Y 轴网格（4 条横线）
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    ctx.fillStyle = '#bfbfbf'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i) / 4
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(cssWidth - padR, y)
      ctx.stroke()
      // Y 标签
      const v = Math.round((yMax * (4 - i)) / 4)
      ctx.fillText(String(v), padL - 6, y)
    }

    // 数据点归一化
    const stepX = points.length > 1 ? chartW / (points.length - 1) : 0
    const coords = points.map((p, i) => ({
      x: padL + stepX * i,
      y: padT + chartH - (p.value / yMax) * chartH,
      label: p.label,
      value: p.value,
    }))

    // 画渐变面积（线下方）—— 校园易物橘色
    if (coords.length >= 2) {
      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH)
      grad.addColorStop(0, 'rgba(255,107,53,0.30)')
      grad.addColorStop(1, 'rgba(255,107,53,0.02)')
      ctx.beginPath()
      ctx.moveTo(coords[0].x, padT + chartH)
      coords.forEach((c) => ctx.lineTo(c.x, c.y))
      ctx.lineTo(coords[coords.length - 1].x, padT + chartH)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
    }

    // 画折线 —— 校园易物橘色
    if (coords.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(coords[0].x, coords[0].y)
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x, coords[i].y)
      }
      ctx.strokeStyle = '#ff6b35'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    // 画数据点 + X 标签
    coords.forEach((c, idx) => {
      // 圆点
      ctx.beginPath()
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#ff6b35'
      ctx.lineWidth = 2
      ctx.stroke()

      // X 标签
      ctx.fillStyle = '#999999'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(c.label, c.x, padT + chartH + 8)
    })
  },

  // ========== Canvas 绘制：柱状图 ==========

  async drawBars() {
    const { ctx, cssWidth, cssHeight } = await getCanvasContext('barCanvas')
    const data = this.data.topCategories
    if (!data.length) return

    ctx.clearRect(0, 0, cssWidth, cssHeight)

    const padL = 30
    const padR = 16
    const padT = 30 // 顶部留数值标签空间
    const padB = 36
    const chartW = cssWidth - padL - padR
    const chartH = cssHeight - padT - padB

    const maxVal = Math.max(...data.map((d) => parseFloat(d.amount) || 0), 1)
    // 找最大值的 1.1 倍作为 Y 轴上限（圆整到 100 的倍数）
    const yMax = Math.ceil((maxVal * 1.1) / 100) * 100 || 100

    // 网格 + Y 标签
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    ctx.fillStyle = '#bfbfbf'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i) / 4
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(cssWidth - padR, y)
      ctx.stroke()
      const v = Math.round((yMax * (4 - i)) / 4)
      ctx.fillText(String(v), padL - 6, y)
    }

    // 画柱子
    const gap = 12
    const barW = Math.max(20, (chartW - gap * (data.length + 1)) / data.length)

    data.forEach((d, i) => {
      const x = padL + gap + (barW + gap) * i
      const h = (parseFloat(d.amount) / yMax) * chartH
      const y = padT + chartH - h

      // 圆角矩形柱
      this.drawRoundRect(ctx, x, y, barW, h, 6)
      const grad = ctx.createLinearGradient(0, y, 0, y + h)
      grad.addColorStop(0, d.color)
      grad.addColorStop(1, this.lightenColor(d.color, 0.3))
      ctx.fillStyle = grad
      ctx.fill()

      // 数值标签（在柱顶上方）
      ctx.fillStyle = '#1f1f1f'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(d.amount, x + barW / 2, y - 4)

      // X 标签（分类名）
      ctx.fillStyle = '#666666'
      ctx.font = '11px sans-serif'
      ctx.textBaseline = 'top'
      const name = d.name.length > 4 ? d.name.slice(0, 4) + '…' : d.name
      ctx.fillText(name, x + barW / 2, padT + chartH + 8)
    })
  },

  /**
   * Canvas 2D 不支持 border-radius 圆角矩形，需手动实现 path
   */
  drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2
    if (h < 2 * r) r = h / 2
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  },

  /**
   * 把 #rrggbb 转成 rgba 并加白透明
   */
  lightenColor(hex, ratio) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lr = Math.round(r + (255 - r) * ratio)
    const lg = Math.round(g + (255 - g) * ratio)
    const lb = Math.round(b + (255 - b) * ratio)
    return `rgb(${lr},${lg},${lb})`
  },
})
