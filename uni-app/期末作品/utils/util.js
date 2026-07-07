/**
 * 工具函数模块
 * 提供收藏管理、搜索、格式化等通用功能
 */

/**
 * 获取收藏列表
 * @returns {Array} 收藏的诗词ID数组
 */
function getFavorites() {
	try {
		return uni.getStorageSync('favorites') || [];
	} catch (e) {
		return [];
	}
}

/**
 * 判断是否已收藏
 * @param {Number} poemId 诗词ID
 * @returns {Boolean} 是否已收藏
 */
function isFavorite(poemId) {
	const favorites = getFavorites();
	return favorites.indexOf(poemId) > -1;
}

/**
 * 切换收藏状态
 * @param {Number} poemId 诗词ID
 * @returns {Boolean} 收藏后的状态（true=已收藏）
 */
function toggleFavorite(poemId) {
	let favorites = getFavorites();
	const index = favorites.indexOf(poemId);
	if (index > -1) {
		favorites.splice(index, 1);
		uni.setStorageSync('favorites', favorites);
		return false;
	} else {
		favorites.unshift(poemId);
		uni.setStorageSync('favorites', favorites);
		return true;
	}
}

/**
 * 获取收藏的诗词详情列表
 * @param {Array} poems 所有诗词数据
 * @returns {Array} 收藏的诗词详情
 */
function getFavoritePoems(poems) {
	const favorites = getFavorites();
	return favorites.map(id => poems.find(p => p.id === id)).filter(p => p);
}

/**
 * 搜索诗词
 * @param {String} keyword 搜索关键词
 * @param {Array} poems 诗词数据源
 * @returns {Array} 搜索结果
 */
function searchPoems(keyword, poems) {
	if (!keyword || !keyword.trim()) return [];
	const kw = keyword.trim().toLowerCase();
	return poems.filter(p => {
		return p.title.toLowerCase().includes(kw) ||
		       p.author.toLowerCase().includes(kw) ||
		       p.content.toLowerCase().includes(kw) ||
		       p.theme.toLowerCase().includes(kw) ||
		       p.tags.some(tag => tag.toLowerCase().includes(kw));
	});
}

/**
 * 按朝代筛选
 * @param {String} dynasty 朝代
 * @param {Array} poems 诗词数据源
 * @returns {Array} 筛选结果
 */
function filterByDynasty(dynasty, poems) {
	if (dynasty === 'all') return poems;
	return poems.filter(p => p.dynasty === dynasty);
}

/**
 * 按体裁筛选
 * @param {String} type 体裁
 * @param {Array} poems 诗词数据源
 * @returns {Array} 筛选结果
 */
function filterByType(type, poems) {
	if (type === 'all') return poems;
	return poems.filter(p => p.type === type);
}

/**
 * 按主题筛选
 * @param {String} theme 主题
 * @param {Array} poems 诗词数据源
 * @returns {Array} 筛选结果
 */
function filterByTheme(theme, poems) {
	return poems.filter(p => p.theme === theme || p.tags.includes(theme));
}

/**
 * 获取推荐诗词（随机）
 * @param {Array} poems 诗词数据源
 * @param {Number} count 数量
 * @returns {Array} 推荐诗词
 */
function getRecommendPoems(poems, count = 6) {
	const shuffled = [...poems].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

/**
 * 获取热门诗词（按浏览量）
 * @param {Array} poems 诗词数据源
 * @param {Number} count 数量
 * @returns {Array} 热门诗词
 */
function getHotPoems(poems, count = 6) {
	return [...poems].sort((a, b) => b.views - a.views).slice(0, count);
}

/**
 * 获取可背诵的诗词
 * @param {Array} poems 诗词数据源
 * @returns {Array} 可背诵诗词
 */
function getRecitePoems(poems) {
	return poems.filter(p => p.recite);
}

/**
 * 根据ID获取诗词
 * @param {Number} id 诗词ID
 * @param {Array} poems 诗词数据源
 * @returns {Object|null} 诗词对象
 */
function getPoemById(id, poems) {
	return poems.find(p => p.id === id) || null;
}

/**
 * 根据ID获取诗人
 * @param {String} id 诗人ID
 * @param {Array} poets 诗人数据源
 * @returns {Object|null} 诗人对象
 */
function getPoetById(id, poets) {
	return poets.find(p => p.id === id) || null;
}

/**
 * 获取诗人的所有作品
 * @param {String} poetId 诗人ID
 * @param {Array} poems 诗词数据源
 * @returns {Array} 诗人的作品
 */
function getPoemsByPoet(poetId, poems) {
	return poems.filter(p => p.authorId === poetId);
}

/**
 * 格式化数字（万）
 * @param {Number} num 数字
 * @returns {String} 格式化后的字符串
 */
function formatNumber(num) {
	if (num >= 10000) {
		return (num / 10000).toFixed(1) + '万';
	}
	return num.toString();
}

/**
 * 获取导航栏信息（状态栏高度、胶囊按钮位置、导航栏高度）
 * 用于自定义导航栏时避让微信小程序原生胶囊按钮
 * @returns {Object} 导航栏信息
 *   - statusBarHeight: 状态栏高度(px)
 *   - navContentHeight: 导航栏内容区高度(px)
 *   - navBarHeight: 导航栏总高度(px) = 状态栏高度 + 内容区高度
 *   - menuRight: 胶囊按钮右侧距屏幕右侧距离(px)
 *   - menuWidth: 胶囊按钮宽度(px)
 *   - menuHeight: 胶囊按钮高度(px)
 *   - safeAreaBottom: 底部安全区高度(px)
 *   - tabBarHeight: tabBar高度(px)，非tab页为0
 */
function getNavBarInfo() {
	const sysInfo = uni.getSystemInfoSync();
	const statusBarHeight = sysInfo.statusBarHeight || 20;
	// 默认值（H5/App端无胶囊按钮）
	let navContentHeight = 44;
	let navBarHeight = statusBarHeight + 44;
	let menuRight = 10;
	let menuWidth = 87;
	let menuHeight = 32;
	let safeAreaBottom = 0;

	// 底部安全区
	if (sysInfo.safeArea && sysInfo.safeArea.bottom !== undefined) {
		safeAreaBottom = sysInfo.screenHeight - sysInfo.safeArea.bottom;
	}
	if (sysInfo.safeAreaInsets && sysInfo.safeAreaInsets.bottom) {
		safeAreaBottom = sysInfo.safeAreaInsets.bottom;
	}

	// #ifdef MP-WEIXIN
	try {
		const menuButton = uni.getMenuButtonBoundingClientRect();
		if (menuButton && menuButton.height > 0) {
			// 导航栏内容区高度 = 胶囊按钮高度 + (胶囊按钮顶部到状态栏底部间距) * 2
			// 这样保证胶囊按钮在内容区中垂直居中
			navContentHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height;
			navBarHeight = statusBarHeight + navContentHeight;
			menuRight = sysInfo.windowWidth - menuButton.right;
			menuWidth = menuButton.width;
			menuHeight = menuButton.height;
		}
	} catch (e) {
		console.error('获取胶囊按钮信息失败', e);
	}
	// #endif

	return {
		statusBarHeight,
		navContentHeight,
		navBarHeight,
		menuRight,
		menuWidth,
		menuHeight,
		safeAreaBottom
	};
}

/**
 * 增加浏览量
 * @param {Number} poemId 诗词ID
 */
function addView(poemId) {
	const key = 'views_' + poemId;
	let views = uni.getStorageSync(key) || 0;
	views++;
	uni.setStorageSync(key, views);
	return views;
}

/**
 * 获取背诵记录
 * @returns {Object} 背诵记录
 */
function getReciteRecords() {
	try {
		return uni.getStorageSync('reciteRecords') || {};
	} catch (e) {
		return {};
	}
}

/**
 * 记录背诵结果
 * @param {Number} poemId 诗词ID
 * @param {Number} score 分数
 * @param {Number} total 总题数
 */
function saveReciteRecord(poemId, score, total) {
	let records = getReciteRecords();
	if (!records[poemId]) {
		records[poemId] = [];
	}
	records[poemId].push({
		score: score,
		total: total,
		accuracy: Math.round((score / total) * 100),
		date: new Date().toLocaleDateString()
	});
	// 只保留最近10条
	if (records[poemId].length > 10) {
		records[poemId] = records[poemId].slice(-10);
	}
	uni.setStorageSync('reciteRecords', records);
}

/**
 * 获取学习统计
 * @returns {Object} 统计数据
 */
function getStudyStats() {
	const favorites = getFavorites();
	const records = getReciteRecords();
	const totalRecite = Object.values(records).reduce((sum, arr) => sum + arr.length, 0);
	const bestScores = Object.values(records).map(arr => 
		Math.max(...arr.map(r => r.accuracy))
	);
	const avgAccuracy = bestScores.length > 0 
		? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length)
		: 0;
	
	return {
		favoriteCount: favorites.length,
		reciteCount: totalRecite,
		avgAccuracy: avgAccuracy,
		studiedPoems: new Set([...favorites, ...Object.keys(records).map(Number)]).size
	};
}

/**
 * 显示提示
 * @param {String} title 提示文字
 * @param {String} icon 图标类型
 */
function showToast(title, icon = 'none') {
	uni.showToast({
		title: title,
		icon: icon,
		duration: 2000
	});
}

/**
 * 显示加载
 * @param {String} title 加载文字
 */
function showLoading(title = '加载中...') {
	uni.showLoading({
		title: title,
		mask: true
	});
}

/**
 * 隐藏加载
 */
function hideLoading() {
	uni.hideLoading();
}

/**
 * 延时
 * @param {Number} ms 毫秒
 * @returns {Promise}
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	// 收藏
	getFavorites,
	isFavorite,
	toggleFavorite,
	getFavoritePoems,
	// 搜索
	searchPoems,
	// 筛选
	filterByDynasty,
	filterByType,
	filterByTheme,
	// 推荐
	getRecommendPoems,
	getHotPoems,
	getRecitePoems,
	// 查询
	getPoemById,
	getPoetById,
	getPoemsByPoet,
	// 格式化
	formatNumber,
	// 导航栏
	getNavBarInfo,
	// 浏览
	addView,
	// 背诵
	getReciteRecords,
	saveReciteRecord,
	getStudyStats,
	// UI
	showToast,
	showLoading,
	hideLoading,
	delay
};
