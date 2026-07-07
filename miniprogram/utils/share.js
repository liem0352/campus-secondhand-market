/**
 * utils/share.js
 * --------------------------------------------------------------------
 * 小程序分享/转发帮助函数
 * - 解决商品/订单/详情页的分享配置
 * - 自动生成默认的分享标题与图片
 * - 简化 Page.onShareAppMessage / onShareTimeline 逻辑
 * --------------------------------------------------------------------
 * 用法：
 *   const share = require('../../utils/share')
 *
 *   Page({
 *     ...share.productShare({
 *       getProduct() { return this.data.product },
 *       getSeller() { return this.data.seller },
 *     })
 *   })
 */

const app = getApp()

/**
 * 构造商品分享配置
 * @param {Object} opts
 * @param {Function} opts.getProduct - 返回当前商品对象
 * @param {Function} [opts.getSeller] - 返回当前卖家对象
 * @param {Function} [opts.title] - 自定义标题生成函数
 * @param {string} [opts.pathTemplate] - 路径模板，含 :id
 */
function productShare(opts) {
  return {
    /**
     * 转发给好友
     */
    onShareAppMessage() {
      const product = opts.getProduct?.call(this) || this.data?.product || {}
      const seller = opts.getSeller?.call(this) || product.seller || {}
      const price = product.price ? `¥${Number(product.price).toFixed(2)}` : ''
      const title = opts.title?.call(this, product, seller)
        || `${product.title || '闲置好物'} ${price ? '· ' + price : ''}`.trim()

      const pathTemplate = opts.pathTemplate || '/pages/detail/detail?id=:id'
      const path = pathTemplate.replace(':id', product.id || '')

      return {
        title: title.slice(0, 60),
        path,
        imageUrl: product.cover || product.images?.[0]?.image_url || app?.globalData?.defaultShareImage || '',
      }
    },

    /**
     * 分享到朋友圈
     */
    onShareTimeline() {
      const product = opts.getProduct?.call(this) || this.data?.product || {}
      const price = product.price ? ` ¥${Number(product.price).toFixed(2)}` : ''
      return {
        title: `${product.title || '校园好物'}${price}`,
        query: `id=${product.id || ''}`,
        imageUrl: product.cover || product.images?.[0]?.image_url || '',
      }
    },
  }
}

/**
 * 构造订单分享配置
 * @param {Object} opts
 * @param {Function} opts.getOrder - 返回当前订单
 */
function orderShare(opts) {
  return {
    onShareAppMessage() {
      const order = opts.getOrder?.call(this) || this.data?.order || {}
      const product = order.product || order.product_info || {}
      const title = `我的订单：${product.title || order.id || ''}`
      return {
        title: title.slice(0, 60),
        path: `/pages/orders/orders?highlight=${order.id || ''}`,
        imageUrl: product.cover || '',
      }
    },
  }
}

/**
 * 构造通用页面分享配置（首页 / 分类 / 我的 等）
 * @param {Object} opts
 * @param {string} opts.title - 分享标题
 * @param {string} opts.path - 分享路径
 * @param {string} [opts.imageUrl] - 自定义图片
 */
function pageShare(opts) {
  return {
    onShareAppMessage() {
      return {
        title: opts.title || '校园易物 · 让闲置流动起来',
        path: opts.path || '/pages/index/index',
        imageUrl: opts.imageUrl || app?.globalData?.defaultShareImage || '',
      }
    },
    onShareTimeline() {
      return {
        title: opts.title || '校园易物 · 二手交易平台',
        query: opts.query || '',
      }
    },
  }
}

/**
 * 主动触发分享（点击按钮唤起）
 * @param {string} [title] - 自定义标题
 * @param {string} [imageUrl] - 自定义图片
 * @returns {Promise}
 */
function showShareMenu(title, imageUrl) {
  return new Promise((resolve) => {
    // 微信没有"系统分享弹窗"API，仅配置转发 + 提示
    wx.showActionSheet({
      itemList: ['分享给好友', '复制链接'],
      success(res) {
        if (res.tapIndex === 1) {
          // 复制路径
          const pages = getCurrentPages()
          const route = pages.length ? pages[pages.length - 1].route : ''
          const path = route ? `/${route}` : '/pages/index/index'
          wx.setClipboardData({
            data: `校园易物 - ${title || '好物推荐'} ${path}`,
            success: () => {
              wx.showToast({ title: '已复制', icon: 'success' })
              resolve('copied')
            },
            fail: () => resolve('cancel'),
          })
        } else {
          // 提示用户点击右上角
          wx.showToast({ title: '点击右上角 · · · 分享', icon: 'none' })
          resolve('menu')
        }
      },
      fail: () => resolve('cancel'),
    })
  })
}

module.exports = {
  productShare,
  orderShare,
  pageShare,
  showShareMenu,
}
