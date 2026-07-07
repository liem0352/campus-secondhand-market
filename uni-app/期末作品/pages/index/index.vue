<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-placeholder"></view>
				<view class="nav-title">
					<text class="nav-title-main">古诗文赏析</text>
					<text class="nav-title-sub">传承千年文化</text>
				</view>
				<view class="nav-search" @tap="goSearch">
					<view class="search-icon">
						<view class="search-circle"></view>
						<view class="search-handle"></view>
					</view>
					<text class="search-placeholder">搜索诗词、诗人</text>
				</view>
			</view>
		</view>

		<!-- 占位 -->
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<!-- 轮播图 -->
		<view class="carousel-section">
			<swiper class="carousel" 
				:indicator-dots="true" 
				indicator-color="rgba(255,255,255,0.4)" 
				indicator-active-color="#C0392B"
				:autoplay="true" 
				:interval="4000" 
				:duration="600"
				circular="true"
				@change="onCarouselChange">
				<swiper-item v-for="(banner, index) in banners" :key="index" @tap="onBannerTap(banner)">
					<view class="banner-item">
						<image class="banner-img" :src="banner.image" mode="aspectFill" lazy-load="true"></image>
						<view class="banner-overlay">
							<view class="banner-content">
								<text class="banner-title">{{ banner.title }}</text>
								<text class="banner-subtitle">{{ banner.subtitle }}</text>
								<text class="banner-poet">{{ banner.poet }}</text>
							</view>
						</view>
					</view>
				</swiper-item>
			</swiper>
		</view>

		<!-- 主题分类导航 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">主题分类</text>
				<text class="section-more" @tap="goCategory">查看全部</text>
			</view>
			<scroll-view class="theme-scroll" scroll-x="true" show-scrollbar="false">
				<view class="theme-list">
					<view class="theme-item anim-fade-in-up" 
						v-for="(theme, index) in themes" 
						:key="theme.id"
						:class="delayClasses[index % 6]"
						@tap="goThemePoems(theme)">
						<view class="theme-icon-wrap" :style="{ background: themeColors[index % themeColors.length].bg }">
							<view class="theme-icon" :style="{ color: themeColors[index % themeColors.length].color }">
								<text class="theme-icon-text">{{ theme.nameChar }}</text>
							</view>
						</view>
						<text class="theme-name">{{ theme.name }}</text>
						<text class="theme-count">{{ theme.count || 0 }}首</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 今日推荐 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">今日推荐</text>
				<view class="section-refresh" @tap="refreshRecommend">
					<text class="refresh-text">换一批</text>
				</view>
			</view>
			<view class="recommend-list">
				<view class="poem-card anim-fade-in-up" 
					v-for="(poem, index) in recommendPoems" 
					:key="poem.id"
					:class="delayClasses[index % 4]"
					@tap="goDetail(poem)">
					<view class="poem-card-header">
						<view class="poem-title-wrap">
							<text class="poem-title">{{ poem.title }}</text>
							<text class="poem-dynasty">{{ poem.dynasty }}·{{ poem.author }}</text>
						</view>
						<view class="poem-type-tag">{{ poem.type }}</view>
					</view>
					<text class="poem-content-preview">{{ poem.firstLine }}</text>
					<view class="poem-tags">
						<text class="poem-tag" v-for="tag in poem.topTags" :key="tag">{{ tag }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 名句精选 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">名句精选</text>
			</view>
			<view class="famous-lines">
				<view class="famous-line-card anim-fade-in-up"
					v-for="(line, index) in topFamousLines"
					:key="index"
					:class="delayClasses[index % 4]"
					@tap="goFamousLine(line)">
					<view class="quote-mark">"</view>
					<text class="famous-line-text">{{ line.line }}</text>
					<text class="famous-line-from">—— {{ line.author }}《{{ line.from }}》</text>
				</view>
			</view>
		</view>

		<!-- 热门诗词 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">热门诗词</text>
			</view>
			<view class="hot-list">
				<view class="hot-item anim-fade-in-up"
					v-for="(poem, index) in hotPoems"
					:key="poem.id"
					:class="delayClasses[index % 4]"
					@tap="goDetail(poem)">
					<view class="hot-rank" :class="{ 'rank-top': index < 3 }">
						<text class="rank-num">{{ index + 1 }}</text>
					</view>
					<view class="hot-content">
						<view class="hot-header">
							<text class="hot-title">{{ poem.title }}</text>
							<text class="hot-author">{{ poem.dynasty }}·{{ poem.author }}</text>
						</view>
						<text class="hot-preview">{{ poem.firstLine }}</text>
					</view>
					<view class="hot-views">
						<text class="views-num">{{ poem.formattedViews }}</text>
						<text class="views-label">阅读</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部留白 -->
		<view class="bottom-space"></view>
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
			delayClasses: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6'],
				banners: [
					{ id: 1, title: '静夜思', subtitle: '床前明月光，疑是地上霜', poet: '李白', image: '/static/carousel/banner_1.jpg', poemId: 1 },
					{ id: 2, title: '春晓', subtitle: '春眠不觉晓，处处闻啼鸟', poet: '孟浩然', image: '/static/carousel/banner_2.jpg', poemId: 2 },
					{ id: 3, title: '江雪', subtitle: '千山鸟飞绝，万径人踪灭', poet: '柳宗元', image: '/static/carousel/banner_3.jpg', poemId: 3 },
					{ id: 4, title: '望岳', subtitle: '会当凌绝顶，一览众山小', poet: '杜甫', image: '/static/carousel/banner_4.jpg', poemId: 4 }
				],
				themes: [],
				recommendPoems: [],
				hotPoems: [],
				famousLines: [],
				themeColors: [
					{ bg: '#FBEAE7', color: '#C0392B' },
					{ bg: '#E8F0E5', color: '#2C5F4A' },
					{ bg: '#FFF4E0', color: '#B8860B' },
					{ bg: '#E8EBF0', color: '#2C3E50' },
					{ bg: '#F5E8F0', color: '#8E44AD' },
					{ bg: '#E0F0F0', color: '#16A085' },
					{ bg: '#FBEAE7', color: '#E74C3C' },
					{ bg: '#E8F0E5', color: '#27AE60' }
				],
				currentBanner: 0
		}
	},
	computed: {
		/**
		 * 名句精选（前4条）
		 */
		topFamousLines() {
			return this.famousLines.slice(0, 4);
		}
	},
	onLoad() {
			this.initData();
		},
		onShow() {
			// 刷新数据
			this.loadRecommend();
		},
		onPullDownRefresh() {
			this.refreshRecommend();
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		},
		methods: {
			/**
			 * 初始化数据
			 */
			initData() {
			// 获取导航栏信息（状态栏高度、胶囊按钮位置等）
			const navInfo = util.getNavBarInfo();
			this.statusBarHeight = navInfo.statusBarHeight;
			this.navBarHeight = navInfo.navBarHeight;
			this.navContentHeight = navInfo.navContentHeight;
			this.menuRight = navInfo.menuRight;
			this.menuWidth = navInfo.menuWidth;
			this.safeAreaBottom = navInfo.safeAreaBottom;

				// 计算主题数量
				this.themes = themes.map(t => ({
					...t,
					count: poems.filter(p => p.theme === t.id || p.tags.includes(t.id)).length
				}));

				this.famousLines = famousLines;
				this.loadRecommend();
				this.loadHot();
			},

			/**
			 * 加载推荐诗词
			 */
			loadRecommend() {
				this.recommendPoems = util.getRecommendPoems(poems, 4);
			},

			/**
			 * 加载热门诗词
			 */
			loadHot() {
				this.hotPoems = util.getHotPoems(poems, 5);
			},

			/**
			 * 刷新推荐
			 */
			refreshRecommend() {
				this.loadRecommend();
				util.showToast('已更新推荐', 'none');
			},

			/**
			 * 轮播图切换
			 */
			onCarouselChange(e) {
				this.currentBanner = e.detail.current;
			},

			/**
			 * 轮播图点击
			 */
			onBannerTap(banner) {
				const poem = util.getPoemById(banner.poemId, poems);
				if (poem) {
					this.goDetail(poem);
				}
			},

			/**
			 * 跳转搜索页
			 */
			goSearch() {
				uni.navigateTo({ url: '/pages/search/search' });
			},

			/**
			 * 跳转分类页
			 */
			goCategory() {
				uni.switchTab({ url: '/pages/category/category' });
			},

			/**
			 * 跳转主题诗词列表
			 */
			goThemePoems(theme) {
				uni.navigateTo({ 
					url: `/pages/search/search?theme=${theme.id}` 
				});
			},

			/**
			 * 跳转诗词详情
			 */
			goDetail(poem) {
				uni.navigateTo({ 
					url: `/pages/detail/detail?id=${poem.id}` 
				});
			},

			/**
			 * 跳转名句对应的诗词
			 */
			goFamousLine(line) {
				const poem = poems.find(p => p.title === line.from);
				if (poem) {
					this.goDetail(poem);
				}
			},

			/**
			 * 格式化数字
			 */
			formatNumber(num) {
				return util.formatNumber(num);
			}
		}
	}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #F5F1E8;
}

/* ========== 导航栏 ========== */
.nav-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(245, 241, 232, 0.85);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border-bottom: 1rpx solid rgba(212, 201, 181, 0.3);
}

.nav-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 32rpx;
}

.nav-placeholder {
	width: 320rpx;
}

.nav-title {
	display: flex;
	flex-direction: column;
}

.nav-title-main {
	font-size: 36rpx;
	font-weight: 700;
	color: #1A1A1A;
	letter-spacing: 2rpx;
}

.nav-title-sub {
	font-size: 20rpx;
	color: #8B7355;
	margin-top: 4rpx;
	letter-spacing: 4rpx;
}

.nav-search {
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.6);
	border-radius: 999rpx;
	padding: 16rpx 28rpx;
	width: 320rpx;
	height: 64rpx;
}

.search-icon {
	position: relative;
	width: 28rpx;
	height: 28rpx;
	margin-right: 16rpx;
}

.search-circle {
	position: absolute;
	width: 20rpx;
	height: 20rpx;
	border: 3rpx solid #8B7355;
	border-radius: 50%;
	top: 0;
	left: 0;
}

.search-handle {
	position: absolute;
	width: 12rpx;
	height: 3rpx;
	background: #8B7355;
	bottom: 2rpx;
	right: 0;
	transform: rotate(45deg);
	border-radius: 2rpx;
}

.search-placeholder {
	font-size: 24rpx;
	color: #B8A88A;
}

/* ========== 轮播图 ========== */
.carousel-section {
	padding: 24rpx 32rpx 0;
}

.carousel {
	height: 340rpx;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(26, 26, 26, 0.12);
}

.banner-item {
	position: relative;
	width: 100%;
	height: 100%;
}

.banner-img {
	width: 100%;
	height: 100%;
	display: block;
}

.banner-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
	display: flex;
	align-items: center;
	padding: 0 40rpx;
}

.banner-content {
	display: flex;
	flex-direction: column;
}

.banner-title {
	font-size: 48rpx;
	font-weight: 700;
	color: #1A1A1A;
	text-shadow: 0 2rpx 8rpx rgba(255, 255, 255, 0.5);
	letter-spacing: 4rpx;
	margin-bottom: 12rpx;
}

.banner-subtitle {
	font-size: 24rpx;
	color: #2D2D2D;
	text-shadow: 0 1rpx 4rpx rgba(255, 255, 255, 0.5);
	margin-bottom: 8rpx;
}

.banner-poet {
	font-size: 22rpx;
	color: #B8860B;
	font-weight: 500;
}

/* ========== 通用Section ========== */
.section {
	padding: 40rpx 32rpx 0;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1A1A1A;
	position: relative;
	padding-left: 24rpx;
}

.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 8rpx;
	height: 32rpx;
	background: #C0392B;
	border-radius: 4rpx;
}

.section-more, .section-refresh {
	font-size: 24rpx;
	color: #8B7355;
	padding: 8rpx 0;
}

.refresh-text {
	position: relative;
}

/* ========== 主题分类 ========== */
.theme-scroll {
	width: 100%;
	white-space: nowrap;
}

.theme-list {
	display: inline-flex;
	padding: 8rpx 0;
}

.theme-item {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	width: 140rpx;
	margin-right: 24rpx;
}

.theme-icon-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
	transition: transform 0.3s cubic-bezier(0.38, 1.21, 0.22, 1.0);
}

.theme-item:active .theme-icon-wrap {
	transform: scale(0.9);
}

.theme-icon {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.theme-icon-text {
	font-size: 32rpx;
	font-weight: 700;
}

.theme-name {
	font-size: 24rpx;
	color: #1A1A1A;
	margin-bottom: 4rpx;
}

.theme-count {
	font-size: 20rpx;
	color: #8B7355;
}

/* ========== 推荐诗词 ========== */
.recommend-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.poem-card {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
	            box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	border-left: 6rpx solid #C0392B;
}

.poem-card:active {
	transform: scale(0.97);
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}

.poem-card-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.poem-title-wrap {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.poem-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1A1A1A;
	margin-bottom: 8rpx;
}

.poem-dynasty {
	font-size: 22rpx;
	color: #8B7355;
}

.poem-type-tag {
	font-size: 20rpx;
	color: #B8860B;
	background: rgba(184, 134, 11, 0.1);
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(184, 134, 11, 0.2);
}

.poem-content-preview {
	font-size: 28rpx;
	color: #4A4A4A;
	line-height: 1.8;
	margin-bottom: 16rpx;
	font-family: 'STSong', serif;
}

.poem-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.poem-tag {
	font-size: 20rpx;
	color: #C0392B;
	background: rgba(192, 57, 43, 0.06);
	padding: 4rpx 16rpx;
	border-radius: 999rpx;
}

/* ========== 名句精选 ========== */
.famous-lines {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.famous-line-card {
	background: linear-gradient(135deg, #FFFFFF 0%, #FAF7F0 100%);
	border-radius: 24rpx;
	padding: 36rpx 32rpx;
	position: relative;
	overflow: hidden;
	border: 1rpx solid rgba(212, 201, 181, 0.3);
	transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.famous-line-card:active {
	transform: scale(0.97);
}

.quote-mark {
	position: absolute;
	top: 16rpx;
	right: 24rpx;
	font-size: 80rpx;
	color: rgba(192, 57, 43, 0.1);
	font-family: serif;
	line-height: 1;
}

.famous-line-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
	line-height: 1.6;
	margin-bottom: 16rpx;
	font-family: 'STSong', serif;
	display: block;
}

.famous-line-from {
	font-size: 22rpx;
	color: #8B7355;
}

/* ========== 热门诗词 ========== */
.hot-list {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 16rpx 0;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
}

.hot-item {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	transition: background 0.2s ease;
}

.hot-item:active {
	background: rgba(245, 241, 232, 0.5);
}

.hot-rank {
	width: 56rpx;
	height: 56rpx;
	border-radius: 12rpx;
	background: #EDE7D8;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
}

.hot-rank.rank-top {
	background: #C0392B;
}

.rank-num {
	font-size: 28rpx;
	font-weight: 700;
	color: #8B7355;
}

.rank-top .rank-num {
	color: #FAF7F0;
}

.hot-content {
	flex: 1;
	min-width: 0;
}

.hot-header {
	display: flex;
	align-items: baseline;
	margin-bottom: 8rpx;
}

.hot-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-right: 16rpx;
}

.hot-author {
	font-size: 22rpx;
	color: #8B7355;
}

.hot-preview {
	font-size: 24rpx;
	color: #6B6B6B;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: 'STSong', serif;
}

.hot-views {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	margin-left: 16rpx;
}

.views-num {
	font-size: 24rpx;
	font-weight: 600;
	color: #C0392B;
}

.views-label {
	font-size: 18rpx;
	color: #8B7355;
	margin-top: 4rpx;
}

/* ========== 底部留白 ========== */
.bottom-space {
	height: calc(120rpx + 50px + constant(safe-area-inset-bottom));
	height: calc(120rpx + 50px + env(safe-area-inset-bottom));
}
</style>
