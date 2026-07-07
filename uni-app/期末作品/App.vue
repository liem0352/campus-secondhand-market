<script>
	export default {
		onLaunch: function() {
			console.log('App Launch - 古诗文赏析');
			// 初始化系统信息
			this.initSystemInfo();
		},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		},
		methods: {
			/**
			 * 初始化系统信息，获取状态栏高度等
			 */
			initSystemInfo() {
				try {
					const sysInfo = uni.getSystemInfoSync();
					uni.setStorageSync('systemInfo', {
						statusBarHeight: sysInfo.statusBarHeight || 20,
						windowHeight: sysInfo.windowHeight,
						windowWidth: sysInfo.windowWidth,
						platform: sysInfo.platform
					});
				} catch (e) {
					console.error('获取系统信息失败', e);
				}
			}
		}
	}
</script>

<style lang="scss">
/* ========== 全局基础样式 ========== */
page {
	background-color: #F5F1E8;
	color: #1A1A1A;
	font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'STSong', serif;
	font-size: 28rpx;
	line-height: 1.6;
	-webkit-font-smoothing: antialiased;
}

/* ========== 通用动画 ========== */

/* 淡入上移 */
@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 淡入缩放 */
@keyframes fadeInScale {
	from {
		opacity: 0;
		transform: scale(0.92);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

/* 弹性弹入 */
@keyframes springIn {
	0% {
		opacity: 0;
		transform: scale(0.8) translateY(20rpx);
	}
	60% {
		opacity: 1;
		transform: scale(1.03) translateY(-4rpx);
	}
	100% {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

/* 墨迹晕染 */
@keyframes inkSpread {
	0% {
		opacity: 0;
		transform: scale(0.6);
		filter: blur(8rpx);
	}
	100% {
		opacity: 1;
		transform: scale(1);
		filter: blur(0);
	}
}

/* 呼吸脉冲 */
@keyframes breathe {
	0%, 100% {
		opacity: 0.8;
		transform: scale(1);
	}
	50% {
		opacity: 1;
		transform: scale(1.05);
	}
}

/* 渐显 */
@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

/* 从左滑入 */
@keyframes slideInLeft {
	from {
		opacity: 0;
		transform: translateX(-40rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

/* 从右滑入 */
@keyframes slideInRight {
	from {
		opacity: 0;
		transform: translateX(40rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

/* 旋转加载 */
@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* 水波纹 */
@keyframes ripple {
	0% {
		transform: scale(0);
		opacity: 0.6;
	}
	100% {
		transform: scale(2);
		opacity: 0;
	}
}

/* ========== 动画工具类 ========== */
.anim-fade-in-up {
	animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.anim-fade-in-scale {
	animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.anim-spring-in {
	animation: springIn 0.5s cubic-bezier(0.38, 1.21, 0.22, 1.0) both;
}
.anim-ink-spread {
	animation: inkSpread 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.anim-fade-in {
	animation: fadeIn 0.3s ease-out both;
}
.anim-slide-left {
	animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.anim-slide-right {
	animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* 延迟工具类 */
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }
.delay-6 { animation-delay: 0.6s; }

/* ========== 毛玻璃效果 ========== */
.glass {
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border: 1rpx solid rgba(255, 255, 255, 0.18);
}

.glass-dark {
	background: rgba(26, 26, 26, 0.72);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.glass-rice {
	background: rgba(245, 241, 232, 0.85);
	backdrop-filter: blur(20px) saturate(150%);
	-webkit-backdrop-filter: blur(20px) saturate(150%);
}

/* ========== 通用组件样式 ========== */

/* 卡片 */
.card {
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
	            box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:active {
	transform: scale(0.97);
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
}

/* 按钮基础 */
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 40rpx;
	border-radius: 999rpx;
	font-size: 28rpx;
	font-weight: 500;
	transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
	            opacity 0.2s ease;
	min-height: 88rpx;
}

.btn:active {
	transform: scale(0.95);
	opacity: 0.85;
}

.btn-primary {
	background: #C0392B;
	color: #FAF7F0;
}

.btn-outline {
	background: transparent;
	border: 2rpx solid #C0392B;
	color: #C0392B;
}

.btn-ghost {
	background: rgba(192, 57, 43, 0.08);
	color: #C0392B;
}

/* 文字工具类 */
.text-primary { color: #1A1A1A; }
.text-secondary { color: #4A4A4A; }
.text-tertiary { color: #8B7355; }
.text-accent { color: #C0392B; }
.text-gold { color: #B8860B; }
.text-inverse { color: #FAF7F0; }

.font-display { font-size: 48rpx; font-weight: 700; }
.font-headline { font-size: 36rpx; font-weight: 600; }
.font-title { font-size: 32rpx; font-weight: 600; }
.font-subtitle { font-size: 28rpx; font-weight: 500; }
.font-body { font-size: 28rpx; font-weight: 400; }
.font-caption { font-size: 22rpx; font-weight: 400; }

/* 间距工具类 */
.mt-xs { margin-top: 8rpx; }
.mt-sm { margin-top: 16rpx; }
.mt-md { margin-top: 24rpx; }
.mt-lg { margin-top: 32rpx; }
.mt-xl { margin-top: 48rpx; }

.mb-xs { margin-bottom: 8rpx; }
.mb-sm { margin-bottom: 16rpx; }
.mb-md { margin-bottom: 24rpx; }
.mb-lg { margin-bottom: 32rpx; }
.mb-xl { margin-bottom: 48rpx; }

.p-sm { padding: 16rpx; }
.p-md { padding: 24rpx; }
.p-lg { padding: 32rpx; }

/* 弹性布局工具类 */
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-around { display: flex; align-items: center; justify-content: space-around; }
.flex-start { display: flex; align-items: center; justify-content: flex-start; }
.flex-end { display: flex; align-items: center; justify-content: flex-end; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }

/* 溢出处理 */
.ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ellipsis-2 {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.ellipsis-3 {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
}

/* 安全区域 - 兼容 iOS 11.2 以下和以上版本 */
.safe-top {
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
}
.safe-bottom {
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
}
/* TabBar 页面底部避让（tabBar高度约50px + 安全区） */
.safe-bottom-tab {
	padding-bottom: calc(50px + constant(safe-area-inset-bottom));
	padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

/* ========== 滚动条隐藏 ========== */
::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	color: transparent;
}
</style>
