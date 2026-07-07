/**
 * 系统信息获取封装 —— 校园易物
 * --------------------------------------------------------------------
 * 微信已弃用旧的系统信息同步 API，统一改用：
 *   - wx.getWindowInfo()    窗口/屏幕信息（替代大部分字段）
 *   - wx.getDeviceInfo()    设备信息
 *   - wx.getAppBaseInfo()   App / 宿主信息
 *
 * 本文件向上层提供一个 **向后兼容** 的系统信息获取函数：
 *   - 字段名、字段顺序与旧 API 一致；
 *   - 不再触发弃用警告。
 *
 * 推荐调用方式：
 *   const sys = require('../../utils/sys')
 *   const statusBarHeight = sys.getStatusBarHeight()
 *   const dpr = sys.getDpr()
 */
function pickSystem() {
  const win = (wx.getWindowInfo && wx.getWindowInfo()) || {}
  const dev = (wx.getDeviceInfo && wx.getDeviceInfo()) || {}
  const app = (wx.getAppBaseInfo && wx.getAppBaseInfo()) || {}
  return {
    // 屏幕
    pixelRatio: win.pixelRatio || 1,
    screenWidth: win.screenWidth || 375,
    screenHeight: win.screenHeight || 667,
    windowWidth: win.windowWidth || win.screenWidth || 375,
    windowHeight: win.windowHeight || win.screenHeight || 667,
    statusBarHeight: win.statusBarHeight || 20,
    safeArea: win.safeArea || null,
    // 设备
    model: dev.model || '',
    system: dev.system || '',
    platform: dev.platform || 'devtools',
    // App
    version: app.version || '1.0.0',
    SDKVersion: app.SDKVersion || '',
    language: app.language || 'zh_CN',
  }
}

/** 同步获取完整系统信息（兼容旧 API 调用方式） */
function getSystemInfoSync() {
  try {
    return pickSystem()
  } catch (e) {
    return {
      pixelRatio: 1,
      statusBarHeight: 20,
      screenWidth: 375,
      screenHeight: 667,
      system: '',
      model: '',
      platform: 'devtools',
    }
  }
}

/** 单独取状态栏高度 */
function getStatusBarHeight() {
  return getSystemInfoSync().statusBarHeight
}

/** 单独取设备像素比 */
function getDpr() {
  return getSystemInfoSync().pixelRatio
}

module.exports = {
  getSystemInfoSync,
  getStatusBarHeight,
  getDpr,
}
