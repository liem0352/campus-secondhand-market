<template>
	<view class="page">
		<!-- 自定义导航栏 + 搜索框 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-back" @tap="goBack">
					<view class="back-arrow"></view>
				</view>
				<view class="search-box">
					<view class="search-icon">
						<view class="search-circle"></view>
						<view class="search-handle"></view>
					</view>
					<input class="search-input" 
						type="text" 
						v-model="keyword" 
						placeholder="搜索诗词、作者、名句" 
						placeholder-class="search-placeholder"
						confirm-type="search"
						@confirm="doSearch"
						@input="onInput" />
					<view class="search-clear" v-if="keyword" @tap="clearKeyword">
						<view class="clear-circle"></view>
						<view class="clear-x"></view>
					</view>
				</view>
				<view class="nav-search-btn" @tap="doSearch">
					<text class="search-btn-text">搜索</text>
				</view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<!-- 搜索结果 -->
		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-if="hasSearched">
			<view class="result-header anim-fade-in">
				<text class="result-count">找到 {{ searchResults.length }} 首相关诗词</text>
				<view class="sort-btn" @tap="toggleSort">
					<text class="sort-text">{{ sortText }}</text>
					<view class="sort-arrow" :class="{ up: sortBy === 'hot' }"></view>
				</view>
			</view>

			<view class="result-list" v-if="searchResults.length > 0">
				<view class="result-item anim-fade-in-up" 
					:class="delayClasses[i % 5]"
					v-for="(poem, i) in sortedResults" 
					:key="poem.id"
					@tap="goDetail(poem)">
					<view class="result-card">
						<view class="card-top">
							<text class="poem-title">
								<text v-for="(seg, si) in splitHighlight(poem.title)" :key="si" :class="{ highlight: seg.highlight }">{{ seg.text }}</text>
							</text>
							<view class="poem-type-tag">{{ poem.type }}</view>
						</view>
						<text class="poem-author">
							<text v-for="(seg, si) in splitHighlight(poem.dynasty + ' · ' + poem.author)" :key="si" :class="{ highlight: seg.highlight }">{{ seg.text }}</text>
						</text>
						<text class="poem-content">
							<text v-for="(seg, si) in splitHighlight(truncateContent(poem.content))" :key="si" :class="{ highlight: seg.highlight }">{{ seg.text }}</text>
						</text>
						<view class="card-tags">
							<text class="tag-item" v-for="tag in poem.topTags" :key="tag">{{ tag }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 无结果 -->
			<view class="no-result anim-fade-in-scale" v-else>
				<view class="no-result-icon">
					<view class="icon-circle"></view>
					<view class="icon-line-1"></view>
					<view class="icon-line-2"></view>
				</view>
				<text class="no-result-title">未找到相关诗词</text>
				<text class="no-result-desc">试试其他关键词，或浏览推荐主题</text>
				<view class="no-result-btn" @tap="goCategory">
					<text class="btn-text">浏览分类</text>
				</view>
			</view>
		</scroll-view>

		<!-- 搜索建议（输入时） -->
		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-else-if="suggestions.length > 0">
			<view class="suggest-section">
				<text class="suggest-title">搜索建议</text>
				<view class="suggest-list">
					<view class="suggest-item anim-fade-in" 
						v-for="(item, i) in suggestions" 
						:key="i"
						@tap="selectSuggestion(item)">
						<view class="suggest-icon">
							<view class="search-mini"></view>
						</view>
						<text class="suggest-text">
							<text v-for="(seg, si) in splitHighlight(item.text)" :key="si" :class="{ highlight: seg.highlight }">{{ seg.text }}</text>
						</text>
						<text class="suggest-type">{{ item.type }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 默认页面（搜索历史 + 热门搜索 + 主题） -->
		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-else>
			<!-- 搜索历史 -->
			<view class="section anim-fade-in-up" v-if="history.length > 0">
				<view class="section-header">
					<text class="section-title">搜索历史</text>
					<view class="clear-history" @tap="clearHistory">
						<view class="clear-icon"></view>
						<text class="clear-text">清除</text>
					</view>
				</view>
				<view class="history-tags">
					<view class="history-tag" v-for="(item, i) in history" :key="i" @tap="searchFromHistory(item)">
						<text class="history-text">{{ item }}</text>
					</view>
				</view>
			</view>

			<!-- 热门搜索 -->
			<view class="section anim-fade-in-up delay-1">
				<view class="section-header">
					<text class="section-title">热门搜索</text>
				</view>
				<view class="hot-list">
					<view class="hot-item" 
						v-for="(item, i) in hotSearch" 
						:key="i"
						@tap="searchHot(item)">
						<view class="hot-rank" :class="{ top: i < 3 }">{{ i + 1 }}</view>
						<text class="hot-text">{{ item }}</text>
						<view class="hot-tag" v-if="i < 3">HOT</view>
					</view>
				</view>
			</view>

			<!-- 主题分类 -->
			<view class="section anim-fade-in-up delay-2">
				<view class="section-header">
					<text class="section-title">按主题浏览</text>
				</view>
				<view class="theme-grid">
					<view class="theme-item" 
						v-for="(theme, i) in themes" 
						:key="i"
						:style="{ background: themeColors[i % themeColors.length] }"
						@tap="searchTheme(theme)">
						<view class="theme-icon-wrap">
							<view class="theme-icon" :class="theme.iconClass"></view>
						</view>
						<text class="theme-name">{{ theme.name }}</text>
						<text class="theme-count">{{ theme.count }}首</text>
					</view>
				</view>
			</view>

			<!-- 名句精选 -->
			<view class="section anim-fade-in-up delay-3">
				<view class="section-header">
					<text class="section-title">名句精选</text>
				</view>
				<view class="quote-list">
					<view class="quote-item" 
						v-for="(item, i) in topFamousLines" 
						:key="i"
						@tap="searchQuote(item)">
						<view class="quote-mark">"</view>
						<view class="quote-content">
							<text class="quote-text">{{ item.line }}</text>
							<text class="quote-from">—— {{ item.author }}《{{ item.from }}》</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { poems, themes, famousLines } from '@/utils/data.js';
	import util from '@/utils/util.js';

	export default {
		data() {
			return {
				statusBarHeight: 20,
				navBarHeight: 64,
				navContentHeight: 44,
				menuRight: 10,
				menuWidth: 87,
				safeAreaBottom: 0,
				scrollHeight: '',
				keyword: '',
				hasSearched: false,
				searchResults: [],
				suggestions: [],
				history: [],
				delayClasses: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5'],
				hotSearch: ['李白', '静夜思', '思乡', '春晓', '苏轼', '月亮', '将进酒', '杜甫'],
				famousLines: famousLines,
				themes: themes.map(t => ({ ...t, iconClass: 'icon-' + t.icon })),
				themeColors: [
					'linear-gradient(135deg, #FBEAE7, #F5D5D0)',
					'linear-gradient(135deg, #F5E6D3, #EBD9B8)',
					'linear-gradient(135deg, #E8E0F0, #D5C9E0)',
					'linear-gradient(135deg, #D5E8E0, #B8D4C8)',
					'linear-gradient(135deg, #F0E8E0, #E0D5C8)',
					'linear-gradient(135deg, #E8F0E8, #C8DCC8)'
				],
				sortBy: 'default'
			};
		},
		computed: {
			/**
			 * 排序后的结果
			 */
			sortedResults() {
				const list = [...this.searchResults];
				if (this.sortBy === 'hot') {
					return list.sort((a, b) => b.views - a.views);
				}
				return list;
			},
			/**
			 * 排序按钮文字
			 */
			sortText() {
			return this.sortBy === 'default' ? '默认' : '热度';
		},
		/**
		 * 名句精选（前6条）
		 */
		topFamousLines() {
			return this.famousLines.slice(0, 6);
		}
	},
		onLoad(options) {
			const navInfo = util.getNavBarInfo();
			this.statusBarHeight = navInfo.statusBarHeight;
			this.navBarHeight = navInfo.navBarHeight;
			this.navContentHeight = navInfo.navContentHeight;
			this.menuRight = navInfo.menuRight;
			this.menuWidth = navInfo.menuWidth;
			this.safeAreaBottom = navInfo.safeAreaBottom;
			this.scrollHeight = 'calc(100vh - ' + navInfo.navBarHeight + 'px - ' + navInfo.safeAreaBottom + 'px)';
			this.loadHistory();
			// 接收主题参数
			if (options.theme) {
				const theme = this.themes.find(t => t.id === options.theme);
				if (theme) {
					this.searchTheme(theme);
				}
			}
		},
		methods: {
			/**
			 * 输入监听
			 */
			onInput(e) {
				const kw = e.detail.value.trim();
				if (kw.length > 0) {
					this.generateSuggestions(kw);
				} else {
					this.suggestions = [];
				}
			},
			/**
			 * 生成搜索建议
			 */
			generateSuggestions(kw) {
				const suggestions = [];
				// 标题匹配
				poems.forEach(p => {
					if (p.title.includes(kw)) {
						suggestions.push({ text: p.title, type: '诗词', poemId: p.id });
					}
				});
				// 作者匹配
				const authors = [...new Set(poems.map(p => p.author))];
				authors.forEach(a => {
					if (a.includes(kw)) {
						suggestions.push({ text: a, type: '诗人' });
					}
				});
				// 主题匹配
				themes.forEach(t => {
					if (t.name.includes(kw) || t.id.includes(kw)) {
						suggestions.push({ text: t.name, type: '主题' });
					}
				});
				this.suggestions = suggestions.slice(0, 8);
			},
			/**
			 * 选择建议
			 */
			selectSuggestion(item) {
				this.keyword = item.text;
				this.doSearch();
			},
			/**
			 * 执行搜索
			 */
			doSearch() {
				const kw = this.keyword.trim();
				if (!kw) {
					util.showToast('请输入搜索关键词');
					return;
				}
				this.hasSearched = true;
				this.suggestions = [];
				this.searchResults = util.searchPoems(kw, poems);
				this.saveHistory(kw);
			},
			/**
			 * 清空关键词
			 */
			clearKeyword() {
				this.keyword = '';
				this.suggestions = [];
				this.hasSearched = false;
			},
			/**
			 * 加载搜索历史
			 */
			loadHistory() {
				try {
					this.history = uni.getStorageSync('searchHistory') || [];
				} catch (e) {
					this.history = [];
				}
			},
			/**
			 * 保存搜索历史
			 */
			saveHistory(kw) {
				let history = this.history.filter(h => h !== kw);
				history.unshift(kw);
				if (history.length > 10) {
					history = history.slice(0, 10);
				}
				this.history = history;
				uni.setStorageSync('searchHistory', history);
			},
			/**
			 * 清除搜索历史
			 */
			clearHistory() {
				uni.showModal({
					title: '提示',
					content: '确定要清除搜索历史吗？',
					confirmColor: '#C0392B',
					success: (res) => {
						if (res.confirm) {
							this.history = [];
							uni.removeStorageSync('searchHistory');
							util.showToast('已清除', 'success');
						}
					}
				});
			},
			/**
			 * 从历史搜索
			 */
			searchFromHistory(kw) {
				this.keyword = kw;
				this.doSearch();
			},
			/**
			 * 热门搜索
			 */
			searchHot(kw) {
				this.keyword = kw;
				this.doSearch();
			},
			/**
			 * 主题搜索
			 */
			searchTheme(theme) {
				this.keyword = theme.id;
				this.hasSearched = true;
				this.searchResults = util.filterByTheme(theme.id, poems);
				this.saveHistory(theme.name);
			},
			/**
			 * 名句搜索
			 */
			searchQuote(item) {
				this.keyword = item.author;
				this.doSearch();
			},
			/**
			 * 获取主题诗词数量
			 */
			getThemeCount(themeId) {
				return util.filterByTheme(themeId, poems).length;
			},
			/**
			 * 切换排序
			 */
			toggleSort() {
				this.sortBy = this.sortBy === 'default' ? 'hot' : 'default';
			},
			/**
			 * 分割文本为高亮段
			 * @param {String} text 原始文本
			 * @returns {Array} 分段数组
			 */
			splitHighlight(text) {
				if (!this.keyword || !text) return [{ text: text || '', highlight: false }];
				const kw = this.keyword.trim();
				if (!kw) return [{ text: text, highlight: false }];
				const reg = new RegExp(kw, 'gi');
				const result = [];
				let lastIndex = 0;
				let match;
				while ((match = reg.exec(text)) !== null) {
					if (match.index > lastIndex) {
						result.push({ text: text.substring(lastIndex, match.index), highlight: false });
					}
					result.push({ text: match[0], highlight: true });
					lastIndex = match.index + match[0].length;
				}
				if (lastIndex < text.length) {
					result.push({ text: text.substring(lastIndex), highlight: false });
				}
				return result.length > 0 ? result : [{ text: text, highlight: false }];
			},
			/**
			 * 截断内容
			 * @param {String} content 原始内容
			 * @returns {String} 截断后的内容
			 */
			truncateContent(content) {
				return content.replace(/\n/g, ' / ').substring(0, 50) + '...';
			},
			/**
			 * 跳转详情
			 */
			goDetail(poem) {
				uni.navigateTo({
					url: `/pages/detail/detail?poemId=${poem.id}`
				});
			},
			/**
			 * 跳转分类
			 */
			goCategory() {
				uni.switchTab({
					url: '/pages/category/category'
				});
			},
			/**
			 * 返回
			 */
			goBack() {
				const pages = getCurrentPages();
				if (pages.length > 1) {
					uni.navigateBack();
				} else {
					uni.switchTab({
						url: '/pages/index/index'
					});
				}
			}
		}
	};
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background-color: #F5F1E8;
}

/* ========== 导航栏 ========== */
.nav-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(245, 241, 232, 0.92);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border-bottom: 1rpx solid rgba(212, 201, 181, 0.3);
}
.nav-content {
	display: flex;
	align-items: center;
	padding: 0 24rpx;
	gap: 16rpx;
}
.nav-back {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.back-arrow {
	width: 20rpx;
	height: 20rpx;
	border-left: 4rpx solid #1A1A1A;
	border-bottom: 4rpx solid #1A1A1A;
	transform: rotate(45deg);
}
.search-box {
	flex: 1;
	height: 64rpx;
	background: #FFFFFF;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	padding: 0 24rpx;
	border: 1rpx solid #E8E0D0;
}
.search-icon {
	width: 28rpx;
	height: 28rpx;
	position: relative;
	margin-right: 12rpx;
}
.search-circle {
	width: 18rpx;
	height: 18rpx;
	border: 3rpx solid #8B7355;
	border-radius: 50%;
}
.search-handle {
	position: absolute;
	bottom: 0;
	right: 0;
	width: 10rpx;
	height: 3rpx;
	background: #8B7355;
	transform: rotate(45deg);
}
.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #1A1A1A;
}
.search-placeholder {
	color: #B8A88A;
}
.search-clear {
	width: 32rpx;
	height: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.clear-circle {
	width: 24rpx;
	height: 24rpx;
	background: #D4C9B5;
	border-radius: 50%;
	position: relative;
}
.clear-x {
	position: absolute;
	width: 12rpx;
	height: 2rpx;
	background: #FFFFFF;
	transform: rotate(45deg);
}
.clear-x::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 12rpx;
	height: 2rpx;
	background: #FFFFFF;
	transform: rotate(90deg);
}
.nav-search-btn {
	padding: 12rpx 20rpx;
}
.search-btn-text {
	font-size: 28rpx;
	color: #C0392B;
	font-weight: 500;
}

/* ========== 内容滚动 ========== */
.content-scroll {
	box-sizing: border-box;
}

/* ========== 搜索结果 ========== */
.result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 32rpx;
}
.result-count {
	font-size: 26rpx;
	color: #8B7355;
}
.sort-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
}
.sort-text {
	font-size: 24rpx;
	color: #4A4A4A;
}
.sort-arrow {
	width: 0;
	height: 0;
	border-left: 6rpx solid transparent;
	border-right: 6rpx solid transparent;
	border-top: 8rpx solid #8B7355;
}
.sort-arrow.up {
	border-top: none;
	border-bottom: 8rpx solid #C0392B;
}

.result-list {
	padding: 0 32rpx 32rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.result-item {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 28rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.result-item:active {
	transform: scale(0.98);
}
.card-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}
.poem-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}
.poem-type-tag {
	padding: 4rpx 16rpx;
	background: #FBEAE7;
	color: #C0392B;
	font-size: 20rpx;
	border-radius: 12rpx;
}
.poem-author {
	font-size: 24rpx;
	color: #8B7355;
	margin-bottom: 16rpx;
	display: block;
}
.poem-content {
	font-size: 26rpx;
	color: #4A4A4A;
	line-height: 1.6;
	margin-bottom: 16rpx;
	font-family: 'STSong', serif;
}
.card-tags {
	display: flex;
	gap: 12rpx;
}
.tag-item {
	font-size: 20rpx;
	color: #8B7355;
	padding: 4rpx 12rpx;
	background: #F5F1E8;
	border-radius: 8rpx;
}

/* ========== 高亮 ========== */
.highlight {
	color: #C0392B;
	font-weight: 600;
}

/* ========== 无结果 ========== */
.no-result {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 64rpx;
}
.no-result-icon {
	width: 160rpx;
	height: 160rpx;
	position: relative;
	margin-bottom: 32rpx;
}
.icon-circle {
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 100rpx;
	height: 100rpx;
	border: 6rpx solid #D4C9B5;
	border-radius: 50%;
}
.icon-line-1 {
	position: absolute;
	top: 40rpx;
	left: 50%;
	transform: translateX(-50%) rotate(45deg);
	width: 60rpx;
	height: 4rpx;
	background: #D4C9B5;
}
.icon-line-2 {
	position: absolute;
	top: 40rpx;
	left: 50%;
	transform: translateX(-50%) rotate(-45deg);
	width: 60rpx;
	height: 4rpx;
	background: #D4C9B5;
}
.no-result-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #4A4A4A;
	margin-bottom: 12rpx;
}
.no-result-desc {
	font-size: 26rpx;
	color: #8B7355;
	margin-bottom: 48rpx;
}
.no-result-btn {
	padding: 20rpx 64rpx;
	background: linear-gradient(135deg, #C0392B, #922B21);
	border-radius: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(192, 57, 43, 0.3);
}
.no-result-btn:active {
	transform: scale(0.97);
}
.btn-text {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: 500;
}

/* ========== 搜索建议 ========== */
.suggest-section {
	padding: 24rpx 32rpx;
}
.suggest-title {
	font-size: 26rpx;
	color: #8B7355;
	margin-bottom: 16rpx;
	display: block;
}
.suggest-list {
	background: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.suggest-item {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid #F5F1E8;
}
.suggest-item:last-child {
	border-bottom: none;
}
.suggest-item:active {
	background: #FAF7F0;
}
.suggest-icon {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}
.search-mini {
	width: 20rpx;
	height: 20rpx;
	border: 3rpx solid #8B7355;
	border-radius: 50%;
	position: relative;
}
.search-mini::after {
	content: '';
	position: absolute;
	bottom: -6rpx;
	right: -4rpx;
	width: 8rpx;
	height: 2rpx;
	background: #8B7355;
	transform: rotate(45deg);
}
.suggest-text {
	flex: 1;
	font-size: 28rpx;
	color: #1A1A1A;
}
.suggest-type {
	font-size: 22rpx;
	color: #B8A88A;
	padding: 4rpx 12rpx;
	background: #F5F1E8;
	border-radius: 8rpx;
}

/* ========== 通用 Section ========== */
.section {
	padding: 24rpx 32rpx;
}
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}
.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
}
.clear-history {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.clear-icon {
	width: 24rpx;
	height: 24rpx;
	border: 2rpx solid #8B7355;
	border-radius: 50%;
	position: relative;
}
.clear-icon::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) rotate(45deg);
	width: 10rpx;
	height: 2rpx;
	background: #8B7355;
}
.clear-icon::before {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) rotate(-45deg);
	width: 10rpx;
	height: 2rpx;
	background: #8B7355;
	z-index: 1;
}
.clear-text {
	font-size: 24rpx;
	color: #8B7355;
}

/* ========== 搜索历史 ========== */
.history-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.history-tag {
	padding: 12rpx 24rpx;
	background: #FFFFFF;
	border-radius: 24rpx;
	border: 1rpx solid #E8E0D0;
}
.history-tag:active {
	background: #FAF7F0;
}
.history-text {
	font-size: 26rpx;
	color: #4A4A4A;
}

/* ========== 热门搜索 ========== */
.hot-list {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 16rpx 32rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.hot-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #F5F1E8;
}
.hot-item:last-child {
	border-bottom: none;
}
.hot-item:active {
	background: #FAF7F0;
}
.hot-rank {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	font-weight: 700;
	color: #8B7355;
	font-family: 'STSong', serif;
	margin-right: 20rpx;
}
.hot-rank.top {
	color: #C0392B;
}
.hot-text {
	flex: 1;
	font-size: 28rpx;
	color: #1A1A1A;
}
.hot-tag {
	padding: 2rpx 10rpx;
	background: #C0392B;
	color: #FFFFFF;
	font-size: 18rpx;
	border-radius: 6rpx;
	font-weight: 600;
}

/* ========== 主题分类 ========== */
.theme-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.theme-item {
	width: calc(33.33% - 12rpx);
	border-radius: 20rpx;
	padding: 24rpx 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.theme-item:active {
	transform: scale(0.95);
}
.theme-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}
.theme-icon {
	width: 36rpx;
	height: 36rpx;
}
.icon-home {
	width: 32rpx;
	height: 24rpx;
	border: 3rpx solid #C0392B;
	border-top: none;
	position: relative;
}
.icon-home::before {
	content: '';
	position: absolute;
	top: -12rpx;
	left: -3rpx;
	width: 0;
	height: 0;
	border-left: 19rpx solid transparent;
	border-right: 19rpx solid transparent;
	border-bottom: 12rpx solid #C0392B;
}
.icon-flower {
	width: 28rpx;
	height: 28rpx;
	background: #C0392B;
	border-radius: 50%;
	position: relative;
}
.icon-flower::before, .icon-flower::after {
	content: '';
	position: absolute;
	width: 28rpx;
	height: 28rpx;
	background: #C0392B;
	border-radius: 50%;
}
.icon-flower::before { top: -14rpx; left: 0; }
.icon-flower::after { top: 0; left: 14rpx; }
.icon-snow {
	width: 4rpx;
	height: 32rpx;
	background: #2C3E50;
	position: relative;
}
.icon-snow::before, .icon-snow::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 32rpx;
	height: 4rpx;
	background: #2C3E50;
	transform: translate(-50%, -50%);
}
.icon-snow::after {
	transform: translate(-50%, -50%) rotate(45deg);
}
.icon-mountain {
	width: 0;
	height: 0;
	border-left: 18rpx solid transparent;
	border-right: 18rpx solid transparent;
	border-bottom: 32rpx solid #2C5F4A;
}
.icon-moon {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: #D4A017;
	box-shadow: inset -10rpx -2rpx 0 0 #F5F1E8;
}
.icon-leaf {
	width: 24rpx;
	height: 32rpx;
	background: #2C5F4A;
	border-radius: 50% 0 50% 0;
	transform: rotate(-30deg);
}
.icon-book {
	width: 28rpx;
	height: 24rpx;
	border: 3rpx solid #2C3E50;
	border-radius: 4rpx;
}
.icon-heart {
	width: 28rpx;
	height: 24rpx;
	background: #C0392B;
	transform: rotate(-45deg);
	position: relative;
}
.icon-heart::before, .icon-heart::after {
	content: '';
	position: absolute;
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: #C0392B;
}
.icon-heart::before { top: -14rpx; left: 0; }
.icon-heart::after { top: 0; left: 14rpx; }
.icon-wind {
	width: 32rpx;
	height: 4rpx;
	background: #2C3E50;
	border-radius: 2rpx;
	position: relative;
}
.icon-wind::before, .icon-wind::after {
	content: '';
	position: absolute;
	width: 20rpx;
	height: 4rpx;
	background: #2C3E50;
	border-radius: 2rpx;
}
.icon-wind::before { top: -10rpx; left: 8rpx; }
.icon-wind::after { top: 10rpx; left: 4rpx; }
.icon-wine {
	width: 20rpx;
	height: 28rpx;
	background: #B8860B;
	border-radius: 0 0 50% 50%;
	position: relative;
}
.icon-wine::before {
	content: '';
	position: absolute;
	top: -8rpx;
	left: -4rpx;
	width: 28rpx;
	height: 8rpx;
	background: #B8860B;
	border-radius: 4rpx;
}
.icon-flag {
	width: 4rpx;
	height: 32rpx;
	background: #2C3E50;
	position: relative;
}
.icon-flag::after {
	content: '';
	position: absolute;
	top: 0;
	left: 4rpx;
	width: 20rpx;
	height: 14rpx;
	background: #C0392B;
}
.icon-tree {
	width: 0;
	height: 0;
	border-left: 14rpx solid transparent;
	border-right: 14rpx solid transparent;
	border-bottom: 20rpx solid #2C5F4A;
	position: relative;
}
.icon-tree::after {
	content: '';
	position: absolute;
	bottom: -16rpx;
	left: -3rpx;
	width: 6rpx;
	height: 12rpx;
	background: #8B7355;
}
.theme-name {
	font-size: 24rpx;
	font-weight: 500;
	color: #1A1A1A;
	margin-bottom: 4rpx;
}
.theme-count {
	font-size: 20rpx;
	color: #8B7355;
}

/* ========== 名句精选 ========== */
.quote-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.quote-item {
	display: flex;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.quote-item:active {
	transform: scale(0.98);
}
.quote-mark {
	font-size: 56rpx;
	color: #C0392B;
	font-family: 'STSong', serif;
	line-height: 1;
	margin-right: 16rpx;
	margin-top: -8rpx;
}
.quote-content {
	flex: 1;
}
.quote-text {
	font-size: 28rpx;
	color: #1A1A1A;
	line-height: 1.6;
	font-family: 'STSong', serif;
	display: block;
	margin-bottom: 8rpx;
}
.quote-from {
	font-size: 22rpx;
	color: #8B7355;
}
</style>
