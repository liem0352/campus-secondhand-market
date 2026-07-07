<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-placeholder"></view>
				<text class="nav-title">我的</text>
				<view class="nav-action" @tap="goSettings">
					<view class="settings-icon">
						<view class="gear-circle"></view>
						<view class="gear-tooth t1"></view>
						<view class="gear-tooth t2"></view>
						<view class="gear-tooth t3"></view>
						<view class="gear-tooth t4"></view>
					</view>
				</view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }">
			<!-- 用户信息卡片 -->
			<view class="profile-card anim-ink-spread">
				<view class="profile-bg"></view>
				<view class="profile-content">
					<view class="avatar-wrap">
						<image class="avatar" :src="userAvatar" mode="aspectFill"></image>
						<view class="avatar-ring"></view>
					</view>
					<view class="user-info">
						<text class="user-name">{{ userName }}</text>
						<text class="user-title">{{ userTitle }}</text>
						<view class="user-meta">
							<text class="meta-text">学诗 {{ studyDays }} 天</text>
							<text class="meta-dot">·</text>
							<text class="meta-text">{{ stats.studiedPoems }} 首已学</text>
						</view>
					</view>
					<view class="edit-btn" @tap="editProfile">
						<text class="edit-text">编辑</text>
					</view>
				</view>
			</view>

			<!-- 学习统计 -->
			<view class="section anim-fade-in-up delay-1">
				<view class="section-header">
					<text class="section-title">学习统计</text>
				</view>
				<view class="stats-grid">
					<view class="stat-card">
						<view class="stat-icon fav-icon-bg">
							<text class="stat-icon-text">♥</text>
						</view>
						<text class="stat-num">{{ stats.favoriteCount }}</text>
						<text class="stat-label">收藏</text>
					</view>
					<view class="stat-card">
						<view class="stat-icon recite-icon-bg">
							<text class="stat-icon-text">✎</text>
						</view>
						<text class="stat-num">{{ stats.reciteCount }}</text>
						<text class="stat-label">背诵</text>
					</view>
					<view class="stat-card">
						<view class="stat-icon acc-icon-bg">
							<view class="icon-target"></view>
						</view>
						<text class="stat-num">{{ stats.avgAccuracy }}%</text>
						<text class="stat-label">正确率</text>
					</view>
					<view class="stat-card">
						<view class="stat-icon study-icon-bg">
							<view class="icon-fire"></view>
						</view>
						<text class="stat-num">{{ studyDays }}</text>
						<text class="stat-label">连续天数</text>
					</view>
				</view>
			</view>

			<!-- 学习进度 -->
			<view class="section anim-fade-in-up delay-2">
				<view class="section-header">
					<text class="section-title">学习进度</text>
					<text class="section-more">{{ stats.studiedPoems }}/{{ totalPoems }}</text>
				</view>
				<view class="progress-card">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
					</view>
					<text class="progress-text">已完成 {{ progressPercent }}% 的诗词学习</text>
				</view>
			</view>

			<!-- 功能菜单 -->
			<view class="section anim-fade-in-up delay-3">
				<view class="section-header">
					<text class="section-title">功能中心</text>
				</view>
				<view class="menu-grid">
					<view class="menu-item" v-for="(item, i) in menuList" :key="i" @tap="goMenu(item)">
						<view class="menu-icon" :style="{ background: item.bg }">
							<view :class="['menu-icon-inner', item.icon]"></view>
						</view>
						<text class="menu-name">{{ item.name }}</text>
					</view>
				</view>
			</view>

			<!-- 设置列表 -->
			<view class="section anim-fade-in-up delay-4">
				<view class="section-header">
					<text class="section-title">设置</text>
				</view>
				<view class="settings-list">
					<view class="settings-item" v-for="(item, i) in settingsList" :key="i" @tap="goSetting(item)">
						<view class="settings-left">
							<view :class="['setting-icon', item.icon]"></view>
							<text class="settings-name">{{ item.name }}</text>
						</view>
						<view class="settings-right">
							<text class="settings-value" v-if="item.value">{{ item.value }}</text>
							<view class="arrow-right"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 关于 -->
			<view class="about-section anim-fade-in-up delay-5">
				<text class="about-version">古诗文赏析 v1.0.0</text>
				<text class="about-desc">传承中华文化，品味诗词之美</text>
			</view>
			<!-- 底部 tabBar 避让占位 -->
			<view :style="{ height: (50 + safeAreaBottom + 20) + 'px' }"></view>
		</scroll-view>
	</view>
</template>

<script>
	import { poems } from '@/utils/data.js';
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
				userName: '墨客',
				userTitle: '诗词爱好者',
				userAvatar: '/static/icons/default_avatar.png',
				studyDays: 1,
				stats: {
					favoriteCount: 0,
					reciteCount: 0,
					avgAccuracy: 0,
					studiedPoems: 0
				},
				menuList: [
					{ name: '我的收藏', icon: 'icon-fav', bg: '#FBEAE7', path: '/pages/favorite/favorite', isTab: true },
					{ name: '背诵记录', icon: 'icon-rec', bg: '#F5E6D3', path: '/pages/recite/recite', isTab: true },
					{ name: '搜索诗词', icon: 'icon-search', bg: '#E8E0F0', path: '/pages/search/search' },
					{ name: '诗人名录', icon: 'icon-poet', bg: '#D5E8E0', path: '/pages/poet/poet?id=libai' }
				],
				settingsList: [
					{ name: '字体大小', icon: 'icon-font', value: '标准' },
					{ name: '夜间模式', icon: 'icon-night', value: '关闭' },
					{ name: '推送通知', icon: 'icon-bell', value: '开启' },
					{ name: '清除缓存', icon: 'icon-cache', value: '' },
					{ name: '关于我们', icon: 'icon-about', value: '' }
				]
			};
		},
		computed: {
			/**
			 * 诗词总数
			 */
			totalPoems() {
				return poems.length;
			},
			/**
			 * 学习进度百分比
			 */
			progressPercent() {
				return this.totalPoems > 0 ? Math.round((this.stats.studiedPoems / this.totalPoems) * 100) : 0;
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
			this.loadUserData();
		},
		onShow() {
			this.loadStats();
		},
		methods: {
			/**
			 * 加载用户数据
			 */
			loadUserData() {
				try {
					const userData = uni.getStorageSync('userData');
					if (userData) {
						this.userName = userData.name || '墨客';
						this.userTitle = userData.title || '诗词爱好者';
						this.userAvatar = userData.avatar || '/static/icons/default_avatar.png';
					}
					const startDate = uni.getStorageSync('startDate');
					if (startDate) {
						const days = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
						this.studyDays = Math.max(1, days);
					} else {
						uni.setStorageSync('startDate', Date.now());
					}
				} catch (e) {
					console.error('加载用户数据失败', e);
				}
			},
			/**
			 * 加载学习统计
			 */
			loadStats() {
				this.stats = util.getStudyStats();
			},
			/**
			 * 编辑资料
			 */
			editProfile() {
				uni.showModal({
					title: '修改昵称',
					editable: true,
					placeholderText: '请输入新的昵称',
					content: this.userName,
					confirmColor: '#C0392B',
					success: (res) => {
						if (res.confirm && res.content) {
							this.userName = res.content;
							uni.setStorageSync('userData', {
								name: this.userName,
								title: this.userTitle,
								avatar: this.userAvatar
							});
							util.showToast('修改成功', 'success');
						}
					}
				});
			},
			/**
			 * 跳转菜单
			 */
			goMenu(item) {
				if (item.isTab) {
					uni.switchTab({ url: item.path });
				} else {
					uni.navigateTo({ url: item.path });
				}
			},
			/**
			 * 跳转设置
			 */
			goSetting(item) {
				switch (item.name) {
					case '清除缓存':
						uni.showModal({
							title: '提示',
							content: '确定要清除缓存吗？收藏和背诵记录不会被清除。',
							confirmColor: '#C0392B',
							success: (res) => {
								if (res.confirm) {
									util.showLoading('清除中...');
									setTimeout(() => {
										util.hideLoading();
										util.showToast('清除成功', 'success');
									}, 800);
								}
							}
						});
						break;
					case '字体大小':
						util.showToast('字体设置功能开发中');
						break;
					case '夜间模式':
						util.showToast('夜间模式开发中');
						break;
					case '推送通知':
						util.showToast('通知设置开发中');
						break;
					case '关于我们':
						uni.showModal({
							title: '关于我们',
							content: '古诗文赏析 v1.0.0\n传承中华文化，品味诗词之美\n\n本应用收录了唐宋经典诗词，提供原文、译文、注释、赏析等功能，助力诗词学习与传承。',
							showCancel: false,
							confirmColor: '#C0392B'
						});
						break;
				}
			},
			/**
			 * 跳转设置页
			 */
			goSettings() {
				util.showToast('设置功能开发中');
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
.nav-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}
.nav-action, .nav-placeholder {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.settings-icon {
	width: 40rpx;
	height: 40rpx;
	position: relative;
}
.gear-circle {
	width: 24rpx;
	height: 24rpx;
	border: 4rpx solid #4A4A4A;
	border-radius: 50%;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.gear-tooth {
	position: absolute;
	background: #4A4A4A;
	border-radius: 2rpx;
}
.gear-tooth.t1 {
	width: 6rpx;
	height: 10rpx;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
}
.gear-tooth.t2 {
	width: 6rpx;
	height: 10rpx;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
}
.gear-tooth.t3 {
	width: 10rpx;
	height: 6rpx;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
}
.gear-tooth.t4 {
	width: 10rpx;
	height: 6rpx;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
}

/* ========== 内容滚动 ========== */
.content-scroll {
	box-sizing: border-box;
}

/* ========== 用户信息卡片 ========== */
.profile-card {
	margin: 24rpx 32rpx;
	border-radius: 32rpx;
	overflow: hidden;
	position: relative;
	box-shadow: 0 8rpx 32rpx rgba(26, 26, 26, 0.12);
}
.profile-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, #2C3E50 0%, #1A1A1A 100%);
}
.profile-bg::before {
	content: '';
	position: absolute;
	top: -50%;
	right: -20%;
	width: 400rpx;
	height: 400rpx;
	background: radial-gradient(circle, rgba(192, 57, 43, 0.3), transparent 70%);
	border-radius: 50%;
}
.profile-bg::after {
	content: '';
	position: absolute;
	bottom: -30%;
	left: -10%;
	width: 300rpx;
	height: 300rpx;
	background: radial-gradient(circle, rgba(212, 160, 23, 0.2), transparent 70%);
	border-radius: 50%;
}
.profile-content {
	position: relative;
	z-index: 1;
	padding: 40rpx 32rpx;
	display: flex;
	align-items: center;
}
.avatar-wrap {
	position: relative;
	margin-right: 28rpx;
}
.avatar {
	width: 128rpx;
	height: 128rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
}
.avatar-ring {
	position: absolute;
	top: -8rpx;
	left: -8rpx;
	right: -8rpx;
	bottom: -8rpx;
	border: 2rpx solid rgba(212, 160, 23, 0.5);
	border-radius: 50%;
}
.user-info {
	flex: 1;
}
.user-name {
	font-size: 40rpx;
	font-weight: 700;
	color: #FAF7F0;
	font-family: 'STSong', serif;
	display: block;
	margin-bottom: 8rpx;
}
.user-title {
	font-size: 24rpx;
	color: #D4A017;
	margin-bottom: 12rpx;
	display: block;
}
.user-meta {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.meta-text {
	font-size: 22rpx;
	color: #B8A88A;
}
.meta-dot {
	font-size: 22rpx;
	color: #B8A88A;
}
.edit-btn {
	padding: 12rpx 24rpx;
	background: rgba(255, 255, 255, 0.15);
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	border-radius: 24rpx;
}
.edit-text {
	font-size: 24rpx;
	color: #FAF7F0;
}

/* ========== 通用 Section ========== */
.section {
	padding: 0 32rpx;
	margin-bottom: 32rpx;
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
.section-more {
	font-size: 24rpx;
	color: #8B7355;
}

/* ========== 统计卡片 ========== */
.stats-grid {
	display: flex;
	gap: 16rpx;
}
.stat-card {
	flex: 1;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 24rpx 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.stat-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}
.fav-icon-bg {
	background: #FBEAE7;
}
.recite-icon-bg {
	background: #F5E6D3;
}
.acc-icon-bg {
	background: #E8E0F0;
}
.study-icon-bg {
	background: #D5E8E0;
}
.stat-icon-text {
	font-size: 32rpx;
	color: #C0392B;
	line-height: 1;
}
.recite-icon-bg .stat-icon-text {
	color: #B8860B;
}
.icon-target {
	width: 24rpx;
	height: 24rpx;
	border: 3rpx solid #2C3E50;
	border-radius: 50%;
	position: relative;
}
.icon-target::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 8rpx;
	height: 8rpx;
	background: #2C3E50;
	border-radius: 50%;
}
.icon-fire {
	width: 22rpx;
	height: 28rpx;
	background: #E74C3C;
	border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
	position: relative;
}
.icon-fire::before {
	content: '';
	position: absolute;
	top: -8rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 12rpx;
	height: 16rpx;
	background: #D4A017;
	border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}
.stat-num {
	font-size: 36rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}
.stat-label {
	font-size: 22rpx;
	color: #8B7355;
	margin-top: 4rpx;
}

/* ========== 学习进度 ========== */
.progress-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 32rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.progress-bar {
	height: 16rpx;
	background: #EDE7D8;
	border-radius: 8rpx;
	overflow: hidden;
	margin-bottom: 16rpx;
}
.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #C0392B, #D4A017);
	border-radius: 8rpx;
	transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.progress-text {
	font-size: 24rpx;
	color: #8B7355;
}

/* ========== 功能菜单 ========== */
.menu-grid {
	display: flex;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 32rpx 16rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.menu-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.menu-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
}
.menu-icon-inner {
	width: 32rpx;
	height: 32rpx;
}
.icon-fav {
	position: relative;
	transform: rotate(-45deg);
	background: #C0392B;
	width: 24rpx;
	height: 20rpx;
}
.icon-fav::before, .icon-fav::after {
	content: '';
	position: absolute;
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: #C0392B;
}
.icon-fav::before { top: -12rpx; left: 0; }
.icon-fav::after { top: 0; left: 12rpx; }
.icon-rec {
	width: 28rpx;
	height: 22rpx;
	border: 3rpx solid #B8860B;
	border-radius: 4rpx;
}
.icon-search {
	width: 28rpx;
	height: 28rpx;
	border: 3rpx solid #2C3E50;
	border-radius: 50%;
	position: relative;
}
.icon-search::after {
	content: '';
	position: absolute;
	bottom: -8rpx;
	right: -4rpx;
	width: 12rpx;
	height: 3rpx;
	background: #2C3E50;
	transform: rotate(45deg);
}
.icon-poet {
	width: 24rpx;
	height: 28rpx;
	background: #2C5F4A;
	border-radius: 12rpx 12rpx 4rpx 4rpx;
	position: relative;
}
.icon-poet::before {
	content: '';
	position: absolute;
	top: 8rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 8rpx;
	height: 8rpx;
	background: #FFFFFF;
	border-radius: 50%;
}
.menu-name {
	font-size: 24rpx;
	color: #4A4A4A;
}

/* ========== 设置列表 ========== */
.settings-list {
	background: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}
.settings-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #F5F1E8;
}
.settings-item:last-child {
	border-bottom: none;
}
.settings-item:active {
	background: #FAF7F0;
}
.settings-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.setting-icon {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}
.icon-font::before {
	content: 'A';
	font-size: 28rpx;
	font-weight: 700;
	color: #C0392B;
}
.icon-night {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: #2C3E50;
	box-shadow: inset -8rpx -4rpx 0 0 #F5F1E8;
}
.icon-bell {
	width: 24rpx;
	height: 24rpx;
	border: 3rpx solid #B8860B;
	border-radius: 50% 50% 50% 0;
	transform: rotate(-30deg);
}
.icon-cache {
	width: 28rpx;
	height: 28rpx;
	border: 3rpx solid #2C5F4A;
	border-radius: 6rpx;
	position: relative;
}
.icon-cache::before {
	content: '';
	position: absolute;
	top: -8rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 16rpx;
	height: 4rpx;
	background: #2C5F4A;
	border-radius: 2rpx;
}
.icon-about {
	width: 28rpx;
	height: 28rpx;
	border: 3rpx solid #2C3E50;
	border-radius: 50%;
	position: relative;
}
.icon-about::before {
	content: '';
	position: absolute;
	top: 6rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 4rpx;
	height: 4rpx;
	background: #2C3E50;
	border-radius: 50%;
}
.icon-about::after {
	content: '';
	position: absolute;
	bottom: 6rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 4rpx;
	height: 12rpx;
	background: #2C3E50;
	border-radius: 2rpx;
}
.settings-name {
	font-size: 28rpx;
	color: #1A1A1A;
}
.settings-right {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.settings-value {
	font-size: 24rpx;
	color: #8B7355;
}
.arrow-right {
	width: 14rpx;
	height: 14rpx;
	border-top: 3rpx solid #D4C9B5;
	border-right: 3rpx solid #D4C9B5;
	transform: rotate(45deg);
}

/* ========== 关于 ========== */
.about-section {
	padding: 48rpx 32rpx 64rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.about-version {
	font-size: 24rpx;
	color: #8B7355;
	margin-bottom: 8rpx;
}
.about-desc {
	font-size: 22rpx;
	color: #B8A88A;
	font-family: 'STSong', serif;
}
</style>
