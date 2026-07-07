<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-back" @tap="goBack">
					<view class="back-arrow"></view>
				</view>
				<text class="nav-title">诗人简介</text>
				<view class="nav-share" @tap="sharePoet">
					<text class="share-icon">↗</text>
				</view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-if="poet">
			<!-- 诗人头部 -->
			<view class="poet-header anim-ink-spread">
				<view class="poet-header-bg"></view>
				<view class="poet-header-content">
					<view class="poet-avatar-wrap">
						<image class="poet-avatar" :src="poet.avatar" mode="aspectFill"></image>
						<view class="avatar-deco"></view>
					</view>
					<view class="poet-name-wrap">
						<text class="poet-name">{{ poet.name }}</text>
						<view class="poet-title-tag">{{ poet.title }}</view>
					</view>
					<view class="poet-meta">
						<view class="meta-item">
							<text class="meta-label">字</text>
							<text class="meta-value">{{ poet.courtesy }}</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item">
							<text class="meta-label">号</text>
							<text class="meta-value">{{ poet.alias }}</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item">
							<text class="meta-label">朝代</text>
							<text class="meta-value">{{ poet.dynasty }}</text>
						</view>
					</view>
					<view class="poet-years">{{ poet.years }}</view>
				</view>
			</view>

			<!-- 简介 -->
			<view class="section anim-fade-in-up delay-1">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">生平简介</text>
					<view class="section-line"></view>
				</view>
				<view class="bio-card">
					<text class="bio-text">{{ poet.bio }}</text>
				</view>
			</view>

			<!-- 数据统计 -->
			<view class="section anim-fade-in-up delay-2">
				<view class="stats-row">
					<view class="stats-block">
						<text class="stats-num">{{ poetWorks.length }}</text>
						<text class="stats-label">收录作品</text>
					</view>
					<view class="stats-block">
						<text class="stats-num">{{ reciteCount }}</text>
						<text class="stats-label">可背诵</text>
					</view>
					<view class="stats-block">
						<text class="stats-num">{{ totalViews }}</text>
						<text class="stats-label">总浏览</text>
					</view>
				</view>
			</view>

			<!-- 代表作品 -->
			<view class="section anim-fade-in-up delay-3">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">代表作品</text>
					<view class="section-line"></view>
				</view>
				<view class="works-list">
					<view class="work-item anim-fade-in-up" 
						v-for="(poem, i) in poetWorks" 
						:key="poem.id"
					:class="delayClasses[i % 4]"
					@tap="goDetail(poem)">
					<view class="work-num">{{ i < 9 ? '0' + (i + 1) : (i + 1) }}</view>
					<view class="work-content">
						<view class="work-header">
							<text class="work-title">{{ poem.title }}</text>
							<view class="work-type-tag">{{ poem.type }}</view>
						</view>
						<text class="work-preview">{{ poem.firstLine }}</text>
							<view class="work-tags">
								<text class="work-tag" v-for="tag in poem.topTags" :key="tag">{{ tag }}</text>
							</view>
						</view>
						<view class="work-arrow"></view>
					</view>
				</view>
			</view>

			<!-- 名句摘录 -->
			<view class="section anim-fade-in-up delay-4" v-if="famousLines.length > 0">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">名句摘录</text>
					<view class="section-line"></view>
				</view>
				<view class="quotes-list">
					<view class="quote-card" v-for="(item, i) in famousLines" :key="i">
						<view class="quote-mark">"</view>
						<text class="quote-text">{{ item.line }}</text>
						<text class="quote-from">《{{ item.from }}》</text>
					</view>
				</view>
			</view>

			<!-- 其他诗人 -->
			<view class="section anim-fade-in-up delay-5">
				<view class="section-title-wrap">
					<view class="section-line"></view>
					<text class="section-title">其他诗人</text>
					<view class="section-line"></view>
				</view>
				<scroll-view scroll-x="true" class="other-poets-scroll" show-scrollbar="false">
					<view class="other-poets">
						<view class="other-poet-item" 
							v-for="other in otherPoets" 
							:key="other.id"
							@tap="switchPoet(other.id)">
							<image class="other-poet-avatar" :src="other.avatar" mode="aspectFill"></image>
							<text class="other-poet-name">{{ other.name }}</text>
							<text class="other-poet-title">{{ other.title }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view style="height: 64rpx;"></view>
		</scroll-view>
	</view>
</template>

<script>
	import { poets, poems, famousLines } from '@/utils/data.js';
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
				delayClasses: ['delay-1', 'delay-2', 'delay-3', 'delay-4'],
				poetId: 'libai',
				poet: null,
				poetWorks: [],
				famousLines: [],
				otherPoets: []
			};
		},
		computed: {
			/**
			 * 可背诵数量
			 */
			reciteCount() {
				return this.poetWorks.filter(p => p.recite).length;
			},
			/**
			 * 总浏览量
			 */
			totalViews() {
				const total = this.poetWorks.reduce((sum, p) => sum + p.views, 0);
				return util.formatNumber(total);
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
			if (options.id) {
				this.poetId = options.id;
			}
			this.loadPoetData();
		},
		methods: {
			/**
			 * 加载诗人数据
			 */
			loadPoetData() {
				this.poet = util.getPoetById(this.poetId, poets);
				if (!this.poet) {
					util.showToast('诗人信息不存在');
					setTimeout(() => this.goBack(), 1500);
					return;
				}
				this.poetWorks = util.getPoemsByPoet(this.poetId, poems);
				// 获取该诗人的名句
				this.famousLines = famousLines.filter(f => f.author === this.poet.name);
				// 其他诗人
				this.otherPoets = poets.filter(p => p.id !== this.poetId);
			},
			/**
			 * 切换诗人
			 */
			switchPoet(id) {
				this.poetId = id;
				this.loadPoetData();
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
			},
			/**
			 * 跳转诗词详情
			 */
			goDetail(poem) {
				uni.navigateTo({
					url: `/pages/detail/detail?poemId=${poem.id}`
				});
			},
			/**
			 * 分享诗人
			 */
			sharePoet() {
				if (!this.poet) return;
				uni.setClipboardData({
					data: `${this.poet.name}（${this.poet.years}）\n${this.poet.title}\n${this.poet.bio}`,
					success: () => {
						util.showToast('已复制诗人信息', 'success');
					}
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
	justify-content: space-between;
	padding: 0 32rpx;
}
.nav-back, .nav-share {
	width: 64rpx;
	height: 64rpx;
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
.nav-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1A1A1A;
}
.share-icon {
	font-size: 36rpx;
	color: #1A1A1A;
	line-height: 1;
}

/* ========== 内容滚动 ========== */
.content-scroll {
	box-sizing: border-box;
}

/* ========== 诗人头部 ========== */
.poet-header {
	margin: 24rpx 32rpx;
	border-radius: 32rpx;
	overflow: hidden;
	position: relative;
	box-shadow: 0 8rpx 32rpx rgba(26, 26, 26, 0.12);
}
.poet-header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, #2C3E50 0%, #1A1A1A 100%);
}
.poet-header-bg::before {
	content: '';
	position: absolute;
	top: -30%;
	right: -20%;
	width: 400rpx;
	height: 400rpx;
	background: radial-gradient(circle, rgba(192, 57, 43, 0.3), transparent 70%);
	border-radius: 50%;
}
.poet-header-bg::after {
	content: '';
	position: absolute;
	bottom: -30%;
	left: -10%;
	width: 300rpx;
	height: 300rpx;
	background: radial-gradient(circle, rgba(212, 160, 23, 0.2), transparent 70%);
	border-radius: 50%;
}
.poet-header-content {
	position: relative;
	z-index: 1;
	padding: 48rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.poet-avatar-wrap {
	position: relative;
	margin-bottom: 24rpx;
}
.poet-avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(255, 255, 255, 0.2);
}
.avatar-deco {
	position: absolute;
	top: -12rpx;
	left: -12rpx;
	right: -12rpx;
	bottom: -12rpx;
	border: 2rpx solid rgba(212, 160, 23, 0.4);
	border-radius: 50%;
}
.poet-name-wrap {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 24rpx;
}
.poet-name {
	font-size: 48rpx;
	font-weight: 700;
	color: #FAF7F0;
	font-family: 'STSong', serif;
}
.poet-title-tag {
	padding: 6rpx 20rpx;
	background: rgba(212, 160, 23, 0.2);
	border: 1rpx solid rgba(212, 160, 23, 0.5);
	border-radius: 20rpx;
	font-size: 22rpx;
	color: #D4A017;
}
.poet-meta {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 16rpx;
}
.meta-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.meta-label {
	font-size: 20rpx;
	color: #B8A88A;
	margin-bottom: 4rpx;
}
.meta-value {
	font-size: 26rpx;
	color: #FAF7F0;
	font-weight: 500;
}
.meta-divider {
	width: 1rpx;
	height: 32rpx;
	background: rgba(184, 168, 138, 0.3);
}
.poet-years {
	font-size: 24rpx;
	color: #D4A017;
	font-family: 'STSong', serif;
}

/* ========== 通用 Section ========== */
.section {
	padding: 0 32rpx;
	margin-bottom: 32rpx;
}
.section-title-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	margin-bottom: 24rpx;
}
.section-line {
	width: 60rpx;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, #D4C9B5, transparent);
}
.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}

/* ========== 简介卡片 ========== */
.bio-card {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	border-left: 6rpx solid #C0392B;
}
.bio-text {
	font-size: 28rpx;
	color: #4A4A4A;
	line-height: 1.8;
	text-align: justify;
}

/* ========== 数据统计 ========== */
.stats-row {
	display: flex;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
}
.stats-block {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.stats-num {
	font-size: 44rpx;
	font-weight: 700;
	color: #C0392B;
	font-family: 'STSong', serif;
}
.stats-label {
	font-size: 22rpx;
	color: #8B7355;
	margin-top: 8rpx;
}

/* ========== 代表作品 ========== */
.works-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.work-item {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 28rpx 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.work-item:active {
	transform: scale(0.98);
	background: #FAF7F0;
}
.work-num {
	font-size: 36rpx;
	font-weight: 700;
	color: #D4C9B5;
	font-family: 'STSong', serif;
	margin-right: 24rpx;
	min-width: 56rpx;
}
.work-content {
	flex: 1;
}
.work-header {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 8rpx;
}
.work-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}
.work-type-tag {
	padding: 2rpx 12rpx;
	background: #FBEAE7;
	color: #C0392B;
	font-size: 20rpx;
	border-radius: 8rpx;
}
.work-preview {
	font-size: 24rpx;
	color: #8B7355;
	margin-bottom: 12rpx;
	display: block;
	font-family: 'STSong', serif;
}
.work-tags {
	display: flex;
	gap: 12rpx;
}
.work-tag {
	font-size: 20rpx;
	color: #8B7355;
	padding: 4rpx 12rpx;
	background: #F5F1E8;
	border-radius: 8rpx;
}
.work-arrow {
	width: 16rpx;
	height: 16rpx;
	border-top: 4rpx solid #B8A88A;
	border-right: 4rpx solid #B8A88A;
	transform: rotate(45deg);
	margin-left: 16rpx;
}

/* ========== 名句摘录 ========== */
.quotes-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.quote-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 32rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
	position: relative;
	border-left: 6rpx solid #D4A017;
}
.quote-mark {
	font-size: 56rpx;
	color: #D4A017;
	font-family: 'STSong', serif;
	line-height: 1;
	position: absolute;
	top: 16rpx;
	left: 24rpx;
	opacity: 0.3;
}
.quote-text {
	font-size: 28rpx;
	color: #1A1A1A;
	line-height: 1.6;
	font-family: 'STSong', serif;
	display: block;
	margin-bottom: 8rpx;
	padding-left: 32rpx;
}
.quote-from {
	font-size: 22rpx;
	color: #8B7355;
	padding-left: 32rpx;
}

/* ========== 其他诗人 ========== */
.other-poets-scroll {
	width: 100%;
}
.other-poets {
	display: flex;
	gap: 24rpx;
	padding: 8rpx;
}
.other-poet-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 160rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 24rpx 16rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.other-poet-item:active {
	transform: scale(0.95);
}
.other-poet-avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	margin-bottom: 12rpx;
	border: 2rpx solid #E8E0D0;
}
.other-poet-name {
	font-size: 26rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-bottom: 4rpx;
	font-family: 'STSong', serif;
}
.other-poet-title {
	font-size: 20rpx;
	color: #8B7355;
}
</style>
