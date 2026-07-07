<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-back" @tap="goBack">
					<view class="back-arrow"></view>
				</view>
				<text class="nav-title">诗词详情</text>
				<view class="nav-fav" @tap="toggleFav">
					<text class="fav-star" :class="{ active: isFav }">{{ isFav ? '♥' : '♡' }}</text>
				</view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-if="poem">
			<!-- 诗词标题区 -->
			<view class="poem-header anim-ink-spread">
				<view class="poem-header-bg"></view>
				<text class="poem-title">{{ poem.title }}</text>
				<view class="poem-meta">
					<text class="poem-author" @tap="goPoet">{{ poem.dynasty }} · {{ poem.author }}</text>
					<text class="poem-type">{{ poem.type }}</text>
				</view>
				<view class="poem-seal">{{ poem.titleChar }}</view>
			</view>

			<!-- 诗词原文 -->
			<view class="section anim-fade-in-up delay-1">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">原文</text>
					<view class="section-line"></view>
				</view>
				<view class="poem-content-card">
					<text class="poem-content-text" v-for="(line, i) in poemLines" :key="i">{{ line }}</text>
				</view>
			</view>

			<!-- 译文 -->
			<view class="section anim-fade-in-up delay-2">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">译文</text>
					<view class="section-line"></view>
				</view>
				<view class="translation-card">
					<text class="translation-text" v-for="(line, i) in translationLines" :key="i">{{ line }}</text>
				</view>
			</view>

			<!-- 注释 -->
			<view class="section anim-fade-in-up delay-3" v-if="poem.annotation && poem.annotation.length">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">注释</text>
					<view class="section-line"></view>
				</view>
				<view class="annotation-list">
					<view class="annotation-item" v-for="(item, i) in poem.annotation" :key="i">
						<text class="annotation-word">{{ item.word }}</text>
						<text class="annotation-meaning">{{ item.meaning }}</text>
					</view>
				</view>
			</view>

			<!-- 赏析 -->
			<view class="section anim-fade-in-up delay-4">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">赏析</text>
					<view class="section-line"></view>
				</view>
				<view class="appreciation-card">
					<text class="appreciation-text">{{ poem.appreciation }}</text>
				</view>
			</view>

			<!-- 标签 -->
			<view class="section anim-fade-in-up delay-5">
				<view class="tags-wrap">
					<text class="tag-item" v-for="tag in poem.tags" :key="tag"># {{ tag }}</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-bar anim-fade-in-up delay-6">
				<view class="action-btn" @tap="startRecite">
					<view class="action-icon recite-icon"></view>
					<text class="action-text">开始背诵</text>
				</view>
				<view class="action-btn" @tap="sharePoem">
					<text class="action-icon share-icon">↗</text>
					<text class="action-text">分享</text>
				</view>
				<view class="action-btn" @tap="copyPoem">
					<view class="action-icon copy-icon"></view>
					<text class="action-text">复制</text>
				</view>
			</view>

			<view style="height: 120rpx;"></view>
		</scroll-view>
	</view>
</template>

<script>
	import { poems, poets } from '@/utils/data.js';
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
				poemId: null,
				poem: null,
				isFav: false,
				poemLines: [],
				translationLines: []
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

			// 兼容 id 和 poemId 两种参数
			const id = options.id || options.poemId;
			if (id) {
				this.poemId = parseInt(id);
				this.loadPoem();
			}
		},
		onShow() {
			if (this.poemId) {
				this.isFav = util.isFavorite(this.poemId);
			}
		},
		methods: {
			/**
			 * 加载诗词详情
			 */
			loadPoem() {
				this.poem = util.getPoemById(this.poemId, poems);
				if (this.poem) {
					this.poemLines = this.poem.content.split('\n');
					this.translationLines = this.poem.translation.split('\n');
					this.isFav = util.isFavorite(this.poemId);
					// 增加浏览量
					util.addView(this.poemId);
				}
			},

			/**
			 * 返回上一页
			 */
			goBack() {
				uni.navigateBack();
			},

			/**
			 * 切换收藏
			 */
			toggleFav() {
				this.isFav = util.toggleFavorite(this.poemId);
				util.showToast(this.isFav ? '已收藏' : '已取消收藏', 'none');
			},

			/**
			 * 跳转诗人页
			 */
			goPoet() {
				if (this.poem && this.poem.authorId) {
					uni.navigateTo({ url: `/pages/poet/poet?id=${this.poem.authorId}` });
				}
			},

			/**
			 * 开始背诵
			 */
			startRecite() {
				uni.navigateTo({ url: `/pages/recite/recite?poemId=${this.poemId}` });
			},

			/**
			 * 分享诗词
			 */
			sharePoem() {
				if (this.poem) {
					uni.setClipboardData({
						data: `${this.poem.title}\n${this.poem.dynasty}·${this.poem.author}\n\n${this.poem.content}`,
						success: () => {
							util.showToast('诗词已复制，可分享给好友', 'none');
						}
					});
				}
			},

			/**
			 * 复制诗词
			 */
			copyPoem() {
				if (this.poem) {
					uni.setClipboardData({
						data: `${this.poem.title}\n${this.poem.dynasty}·${this.poem.author}\n\n${this.poem.content}`,
						success: () => {
							util.showToast('已复制到剪贴板', 'none');
						}
					});
				}
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
	justify-content: space-between;
	padding: 0 32rpx;
}
.nav-back, .nav-fav {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.back-arrow {
	width: 24rpx;
	height: 24rpx;
	border-left: 4rpx solid #1A1A1A;
	border-bottom: 4rpx solid #1A1A1A;
	transform: rotate(45deg);
}
.nav-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1A1A1A;
}
.fav-star {
	font-size: 40rpx;
	color: #B8A88A;
	line-height: 1;
}
.fav-star.active {
	color: #C0392B;
}

/* 内容滚动 */
.content-scroll {
}

/* 诗词标题区 */
.poem-header {
	position: relative;
	padding: 48rpx 32rpx 64rpx;
	text-align: center;
	overflow: hidden;
}
.poem-header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, rgba(192, 57, 43, 0.06) 0%, transparent 100%);
}
.poem-title {
	font-size: 48rpx;
	font-weight: 700;
	color: #1A1A1A;
	letter-spacing: 8rpx;
	position: relative;
	z-index: 1;
	font-family: 'STSong', serif;
}
.poem-meta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	margin-top: 20rpx;
	position: relative;
	z-index: 1;
}
.poem-author {
	font-size: 26rpx;
	color: #8B7355;
}
.poem-type {
	font-size: 22rpx;
	color: #B8860B;
	background: rgba(184, 134, 11, 0.1);
	padding: 6rpx 20rpx;
	border-radius: 999rpx;
}
.poem-seal {
	position: absolute;
	top: 32rpx;
	right: 48rpx;
	width: 72rpx;
	height: 72rpx;
	background: #C0392B;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	font-weight: 700;
	color: #FAF7F0;
	font-family: 'STSong', serif;
	transform: rotate(-5deg);
	box-shadow: 0 4rpx 12rpx rgba(192, 57, 43, 0.3);
}

/* Section */
.section {
	padding: 0 32rpx 40rpx;
}
.section-title-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	margin-bottom: 32rpx;
}
.section-line {
	width: 80rpx;
	height: 2rpx;
	background: linear-gradient(90deg, transparent, #D4C9B5, transparent);
}
.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #8B7355;
	letter-spacing: 4rpx;
}

/* 原文卡片 */
.poem-content-card {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 48rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}
.poem-content-text {
	font-size: 36rpx;
	color: #1A1A1A;
	line-height: 2;
	letter-spacing: 4rpx;
	font-family: 'STSong', serif;
	text-align: center;
}

/* 译文卡片 */
.translation-card {
	background: rgba(255, 255, 255, 0.6);
	border-radius: 24rpx;
	padding: 32rpx;
	border: 1rpx solid rgba(212, 201, 181, 0.3);
}
.translation-text {
	font-size: 28rpx;
	color: #4A4A4A;
	line-height: 1.8;
	margin-bottom: 12rpx;
	display: block;
}
.translation-text:last-child {
	margin-bottom: 0;
}

/* 注释列表 */
.annotation-list {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 16rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
}
.annotation-item {
	display: flex;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1rpx solid rgba(212, 201, 181, 0.2);
}
.annotation-item:last-child {
	border-bottom: none;
}
.annotation-word {
	font-size: 28rpx;
	font-weight: 600;
	color: #C0392B;
	margin-right: 20rpx;
	min-width: 80rpx;
}
.annotation-meaning {
	font-size: 26rpx;
	color: #4A4A4A;
	flex: 1;
	line-height: 1.6;
}

/* 赏析卡片 */
.appreciation-card {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	border-left: 6rpx solid #B8860B;
}
.appreciation-text {
	font-size: 28rpx;
	color: #2D2D2D;
	line-height: 1.9;
	text-align: justify;
}

/* 标签 */
.tags-wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.tag-item {
	font-size: 24rpx;
	color: #C0392B;
	background: rgba(192, 57, 43, 0.06);
	padding: 10rpx 24rpx;
	border-radius: 999rpx;
}

/* 操作按钮 */
.action-bar {
	display: flex;
	justify-content: space-around;
	padding: 32rpx;
	gap: 24rpx;
}
.action-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	flex: 1;
}
.action-icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.08);
	transition: transform 0.3s cubic-bezier(0.38, 1.21, 0.22, 1.0);
}
.action-btn:active .action-icon {
	transform: scale(0.9);
}
.recite-icon {
	background: #C0392B;
	position: relative;
}
.recite-icon::before {
	content: '';
	width: 32rpx;
	height: 24rpx;
	border: 3rpx solid #FAF7F0;
	border-radius: 4rpx;
}
.recite-icon::after {
	content: '';
	position: absolute;
	width: 3rpx;
	height: 24rpx;
	background: #FAF7F0;
	left: 50%;
	transform: translateX(-50%);
}
.share-icon {
	background: #B8860B;
	font-size: 40rpx;
	color: #FAF7F0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.copy-icon {
	background: #2C5F4A;
	position: relative;
}
.copy-icon::before {
	content: '';
	width: 20rpx;
	height: 24rpx;
	border: 3rpx solid #FAF7F0;
	border-radius: 4rpx;
	position: absolute;
	top: 20rpx;
	left: 28rpx;
}
.copy-icon::after {
	content: '';
	width: 20rpx;
	height: 24rpx;
	border: 3rpx solid #FAF7F0;
	border-radius: 4rpx;
	position: absolute;
	top: 28rpx;
	left: 36rpx;
	background: #2C5F4A;
}
.action-text {
	font-size: 24rpx;
	color: #4A4A4A;
}
</style>
