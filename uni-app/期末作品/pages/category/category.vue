<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<text class="nav-title">诗词分类</text>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<!-- 标签切换 -->
		<view class="tab-bar">
			<view class="tab-item" 
				v-for="tab in tabs" 
				:key="tab.id"
				:class="{ active: currentTab === tab.id }"
				@tap="switchTab(tab.id)">
				<text class="tab-text">{{ tab.name }}</text>
				<view class="tab-indicator" v-if="currentTab === tab.id"></view>
			</view>
		</view>

		<!-- 朝代筛选 -->
		<scroll-view class="filter-scroll" scroll-x="true" show-scrollbar="false">
			<view class="filter-list">
				<view class="filter-item" 
					v-for="d in dynasties" 
					:key="d.id"
					:class="{ active: currentDynasty === d.id }"
					@tap="filterDynasty(d.id)">
					<text class="filter-text">{{ d.name }}</text>
					<text class="filter-count">{{ d.count }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- 诗词列表 -->
		<view class="poem-list" v-if="filteredPoems.length > 0">
			<view class="poem-item anim-fade-in-up"
				v-for="(poem, index) in filteredPoems"
				:key="poem.id"
				:class="delayClasses[index % 6]"
				@tap="goDetail(poem)">
				<view class="poem-item-left">
					<view class="poem-item-header">
						<text class="poem-item-title">{{ poem.title }}</text>
						<text class="poem-item-dynasty">{{ poem.dynasty }}·{{ poem.author }}</text>
					</view>
					<text class="poem-item-content">{{ poem.firstLine }}</text>
					<view class="poem-item-tags">
						<text class="poem-item-tag" v-for="tag in poem.topTags" :key="tag">{{ tag }}</text>
						<text class="poem-item-type">{{ poem.type }}</text>
					</view>
				</view>
				<view class="poem-item-right">
					<view class="poem-item-fav" :class="{ active: poem.isFav }" @tap.stop="toggleFav(poem)">
						<text class="fav-icon" :class="{ active: poem.isFav }">♥</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image class="empty-img" src="/static/icons/empty.png" mode="aspectFit"></image>
			<text class="empty-text">暂无相关诗词</text>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { poems, dynasties, types } from '@/utils/data.js';
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
				tabs: [
					{ id: 'all', name: '全部' },
					{ id: 'type', name: '按体裁' },
					{ id: 'theme', name: '按主题' }
				],
				currentTab: 'all',
				currentDynasty: 'all',
				currentType: 'all',
				currentTheme: '',
				dynasties: [],
				types: [],
				filteredPoems: [],
			delayClasses: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6']
			}
		},
		onLoad() {
			const navInfo = util.getNavBarInfo();
			this.statusBarHeight = navInfo.statusBarHeight;
			this.navBarHeight = navInfo.navBarHeight;
			this.navContentHeight = navInfo.navContentHeight;
			this.menuRight = navInfo.menuRight;
			this.menuWidth = navInfo.menuWidth;
			this.safeAreaBottom = navInfo.safeAreaBottom;

			this.dynasties = [
				{ id: 'all', name: '全部', count: poems.length },
				{ id: '唐', name: '唐诗', count: poems.filter(p => p.dynasty === '唐').length },
				{ id: '宋', name: '宋词', count: poems.filter(p => p.dynasty === '宋').length }
			];
			this.types = types;
			this.loadPoems();
		},
		onShow() {
			this.loadPoems();
		},
		methods: {
			/**
			 * 加载诗词列表
			 */
			loadPoems() {
				let result = [...poems];
				// 朝代筛选
				if (this.currentDynasty !== 'all') {
					result = result.filter(p => p.dynasty === this.currentDynasty);
				}
				// 体裁筛选
				if (this.currentTab === 'type' && this.currentType !== 'all') {
					result = result.filter(p => p.type === this.currentType);
				}
				// 主题筛选
				if (this.currentTab === 'theme' && this.currentTheme) {
					result = result.filter(p => p.theme === this.currentTheme || p.tags.includes(this.currentTheme));
				}
				// 添加收藏状态
				result = result.map(p => ({
					...p,
					isFav: util.isFavorite(p.id)
				}));
				this.filteredPoems = result;
			},

			/**
			 * 切换标签
			 */
			switchTab(tabId) {
				this.currentTab = tabId;
				this.currentType = 'all';
				this.currentTheme = '';
				this.loadPoems();
			},

			/**
			 * 筛选朝代
			 */
			filterDynasty(dynasty) {
				this.currentDynasty = dynasty;
				this.loadPoems();
			},

			/**
			 * 跳转详情
			 */
			goDetail(poem) {
				uni.navigateTo({ url: `/pages/detail/detail?id=${poem.id}` });
			},

			/**
			 * 切换收藏
			 */
			toggleFav(poem) {
				const isFav = util.toggleFavorite(poem.id);
				poem.isFav = isFav;
				util.showToast(isFav ? '已收藏' : '已取消收藏', 'none');
			}
		}
	}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #F5F1E8;
}

/* 导航栏 */
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
	justify-content: center;
}
.nav-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1A1A1A;
}

/* 标签栏 */
.tab-bar {
	display: flex;
	background: #FFFFFF;
	padding: 0 32rpx;
	border-bottom: 1rpx solid rgba(212, 201, 181, 0.2);
}
.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 0;
	position: relative;
}
.tab-text {
	font-size: 28rpx;
	color: #8B7355;
	transition: color 0.3s ease;
}
.tab-item.active .tab-text {
	color: #C0392B;
	font-weight: 600;
}
.tab-indicator {
	position: absolute;
	bottom: 0;
	width: 48rpx;
	height: 6rpx;
	background: #C0392B;
	border-radius: 3rpx;
	animation: fadeInUp 0.3s ease;
}

/* 筛选栏 */
.filter-scroll {
	white-space: nowrap;
	background: #FFFFFF;
	padding: 20rpx 32rpx;
	border-bottom: 1rpx solid rgba(212, 201, 181, 0.2);
}
.filter-list {
	display: inline-flex;
	gap: 16rpx;
}
.filter-item {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 28rpx;
	background: #F5F1E8;
	border-radius: 999rpx;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.filter-item.active {
	background: #C0392B;
}
.filter-text {
	font-size: 24rpx;
	color: #4A4A4A;
}
.filter-item.active .filter-text {
	color: #FAF7F0;
}
.filter-count {
	font-size: 20rpx;
	color: #8B7355;
}
.filter-item.active .filter-count {
	color: rgba(250, 247, 240, 0.8);
}

/* 诗词列表 */
.poem-list {
	padding: 24rpx 32rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.poem-item {
	display: flex;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 28rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.poem-item:active {
	transform: scale(0.97);
}
.poem-item-left {
	flex: 1;
	min-width: 0;
}
.poem-item-header {
	display: flex;
	align-items: baseline;
	margin-bottom: 12rpx;
}
.poem-item-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1A1A1A;
	margin-right: 16rpx;
}
.poem-item-dynasty {
	font-size: 22rpx;
	color: #8B7355;
}
.poem-item-content {
	font-size: 26rpx;
	color: #4A4A4A;
	line-height: 1.6;
	margin-bottom: 16rpx;
	font-family: 'STSong', serif;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.poem-item-tags {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.poem-item-tag {
	font-size: 20rpx;
	color: #C0392B;
	background: rgba(192, 57, 43, 0.06);
	padding: 4rpx 16rpx;
	border-radius: 999rpx;
}
.poem-item-type {
	font-size: 20rpx;
	color: #B8860B;
	background: rgba(184, 134, 11, 0.08);
	padding: 4rpx 16rpx;
	border-radius: 999rpx;
}
.poem-item-right {
	display: flex;
	align-items: center;
	padding-left: 16rpx;
}
.poem-item-fav {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.fav-icon {
	font-size: 36rpx;
	color: #D4C9B5;
	line-height: 1;
}
.fav-icon.active {
	color: #C0392B;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0;
}
.empty-img {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 24rpx;
}
.empty-text {
	font-size: 28rpx;
	color: #8B7355;
}

.bottom-space {
	height: calc(120rpx + 50px + constant(safe-area-inset-bottom));
	height: calc(120rpx + 50px + env(safe-area-inset-bottom));
}
</style>
