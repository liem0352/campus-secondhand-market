<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-placeholder"></view>
				<view class="nav-title">我的收藏</view>
				<view class="nav-action" v-if="favoritePoems.length > 0" @tap="toggleEditMode">
					<text class="action-text">{{ isEditing ? '完成' : '管理' }}</text>
				</view>
				<view class="nav-placeholder" v-else></view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<!-- 收藏统计 -->
		<view class="stats-bar anim-fade-in-up" v-if="favoritePoems.length > 0">
			<view class="stats-info">
				<text class="stats-num">{{ favoritePoems.length }}</text>
				<text class="stats-label">首已收藏</text>
			</view>
			<view class="stats-sort">
				<text class="sort-btn" :class="{ active: sortBy === 'time' }" @tap="changeSort('time')">最近</text>
				<text class="sort-divider">|</text>
				<text class="sort-btn" :class="{ active: sortBy === 'dynasty' }" @tap="changeSort('dynasty')">朝代</text>
				<text class="sort-divider">|</text>
				<text class="sort-btn" :class="{ active: sortBy === 'author' }" @tap="changeSort('author')">作者</text>
			</view>
		</view>

		<!-- 收藏列表 -->
		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-if="favoritePoems.length > 0">
			<view class="fav-list">
				<view class="fav-item anim-fade-in-up" 
					:class="delayClasses[index % 6]"
					v-for="(poem, index) in sortedPoems" 
					:key="poem.id"
					@tap="goDetail(poem)">
					<!-- 选择框（编辑模式） -->
					<view class="check-box" v-if="isEditing" @tap.stop="toggleSelect(poem.id)">
						<view class="check-circle" :class="{ checked: selectedIds.indexOf(poem.id) > -1 }">
							<view class="check-mark" v-if="selectedIds.indexOf(poem.id) > -1"></view>
						</view>
					</view>

					<!-- 诗词卡片 -->
					<view class="fav-card">
						<view class="card-header">
							<text class="poem-title">{{ poem.title }}</text>
							<view class="poem-type-tag">{{ poem.type }}</view>
						</view>
						<text class="poem-author">{{ poem.dynasty }} · {{ poem.author }}</text>
						<text class="poem-content-preview">{{ poem.contentPreview }}</text>
						<view class="card-footer">
							<view class="tag-list">
								<text class="mini-tag" v-for="tag in poem.topTags" :key="tag">{{ tag }}</text>
							</view>
							<text class="fav-icon active" @tap.stop="removeFavorite(poem.id)">♥</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部操作栏（编辑模式）- 避让 TabBar 原生控件 -->
			<view class="bottom-bar anim-fade-in" v-if="isEditing">
				<view class="bottom-action select-all" @tap="toggleSelectAll">
					<view class="check-circle" :class="{ checked: isSelectedAll }">
						<view class="check-mark" v-if="isSelectedAll"></view>
					</view>
					<text class="bottom-text">全选</text>
				</view>
				<view class="bottom-action delete-btn" :class="{ disabled: selectedIds.length === 0 }" @tap="deleteSelected">
					<text class="bottom-text">删除{{ selectedIds.length > 0 ? '(' + selectedIds.length + ')' : '' }}</text>
				</view>
			</view>

			<!-- 底部占位 -->
			<view style="height: 160rpx;" v-if="isEditing"></view>
			<!-- 底部 tabBar 避让占位 -->
			<view :style="{ height: (50 + safeAreaBottom + 20) + 'px' }"></view>
		</scroll-view>

		<!-- 空状态 -->
		<view class="empty-state anim-fade-in-scale" v-else>
			<image class="empty-img" src="/static/icons/empty.png" mode="aspectFit"></image>
			<text class="empty-title">暂无收藏</text>
			<text class="empty-desc">去发现更多优美的诗词吧</text>
			<view class="empty-btn" @tap="goCategory">
				<text class="empty-btn-text">浏览诗词</text>
			</view>
		</view>
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
			favoritePoems: [],
				isEditing: false,
				selectedIds: [],
				sortBy: 'time',
			delayClasses: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6']
		};
		},
		computed: {
			/**
			 * 排序后的诗词列表
			 */
			sortedPoems() {
				const list = [...this.favoritePoems];
				if (this.sortBy === 'time') {
					// 按收藏顺序（已在 storage 中按 unshift 排序）
					return list;
				} else if (this.sortBy === 'dynasty') {
					return list.sort((a, b) => a.dynasty.localeCompare(b.dynasty));
				} else if (this.sortBy === 'author') {
					return list.sort((a, b) => a.author.localeCompare(b.author));
				}
				return list;
			},
			/**
			 * 是否全选
			 */
			isSelectedAll() {
				return this.favoritePoems.length > 0 && this.selectedIds.length === this.favoritePoems.length;
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
		this.scrollHeight = 'calc(100vh - ' + navInfo.navBarHeight + 'px - 50px - ' + navInfo.safeAreaBottom + 'px)';
		},
		onShow() {
			this.loadFavorites();
		},
		methods: {
			/**
			 * 加载收藏列表
			 */
			loadFavorites() {
				this.favoritePoems = util.getFavoritePoems(poems);
			},
			/**
			 * 切换编辑模式
			 */
			toggleEditMode() {
				this.isEditing = !this.isEditing;
				if (!this.isEditing) {
					this.selectedIds = [];
				}
			},
			/**
			 * 切换选择
			 */
			toggleSelect(id) {
				const idx = this.selectedIds.indexOf(id);
				if (idx > -1) {
					this.selectedIds.splice(idx, 1);
				} else {
					this.selectedIds.push(id);
				}
			},
			/**
			 * 全选/取消全选
			 */
			toggleSelectAll() {
				if (this.isSelectedAll) {
					this.selectedIds = [];
				} else {
					this.selectedIds = this.favoritePoems.map(p => p.id);
				}
			},
			/**
			 * 删除选中
			 */
			deleteSelected() {
				if (this.selectedIds.length === 0) return;
				uni.showModal({
					title: '提示',
					content: `确定要删除选中的 ${this.selectedIds.length} 首诗词吗？`,
					confirmColor: '#C0392B',
					success: (res) => {
						if (res.confirm) {
							this.selectedIds.forEach(id => {
								util.toggleFavorite(id);
							});
							this.selectedIds = [];
							this.loadFavorites();
							util.showToast('已删除', 'success');
							if (this.favoritePoems.length === 0) {
								this.isEditing = false;
							}
						}
					}
				});
			},
			/**
			 * 移除收藏
			 */
			removeFavorite(id) {
				uni.showModal({
					title: '提示',
					content: '确定要取消收藏这首诗词吗？',
					confirmColor: '#C0392B',
					success: (res) => {
						if (res.confirm) {
							util.toggleFavorite(id);
							this.loadFavorites();
							util.showToast('已取消收藏', 'success');
						}
					}
				});
			},
			/**
			 * 切换排序方式
			 */
			changeSort(sort) {
				this.sortBy = sort;
			},
			/**
			 * 跳转详情
			 */
			goDetail(poem) {
				if (this.isEditing) {
					this.toggleSelect(poem.id);
					return;
				}
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
	width: 120rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.action-text {
	font-size: 28rpx;
	color: #C0392B;
	font-weight: 500;
}

/* ========== 统计栏 ========== */
.stats-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 32rpx;
	background: #FAF7F0;
	border-bottom: 1rpx solid #E8E0D0;
}
.stats-info {
	display: flex;
	align-items: baseline;
	gap: 8rpx;
}
.stats-num {
	font-size: 36rpx;
	font-weight: 700;
	color: #C0392B;
	font-family: 'STSong', serif;
}
.stats-label {
	font-size: 24rpx;
	color: #8B7355;
}
.stats-sort {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.sort-btn {
	font-size: 24rpx;
	color: #8B7355;
	padding: 4rpx 8rpx;
}
.sort-btn.active {
	color: #C0392B;
	font-weight: 600;
}
.sort-divider {
	color: #D4C9B5;
	font-size: 20rpx;
}

/* ========== 收藏列表 ========== */
.content-scroll {
	box-sizing: border-box;
}
.fav-list {
	padding: 24rpx 32rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.fav-item {
	display: flex;
	align-items: stretch;
	gap: 16rpx;
}
.check-box {
	display: flex;
	align-items: center;
	padding-left: 8rpx;
}
.check-circle {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 3rpx solid #D4C9B5;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.check-circle.checked {
	background: #C0392B;
	border-color: #C0392B;
}
.check-mark {
	width: 16rpx;
	height: 8rpx;
	border-left: 3rpx solid #FFFFFF;
	border-bottom: 3rpx solid #FFFFFF;
	transform: rotate(-45deg);
	margin-top: -4rpx;
}

/* ========== 收藏卡片 ========== */
.fav-card {
	flex: 1;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 28rpx 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fav-card:active {
	transform: scale(0.98);
}
.card-header {
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
.poem-content-preview {
	font-size: 26rpx;
	color: #4A4A4A;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	margin-bottom: 20rpx;
	font-family: 'STSong', serif;
}
.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.tag-list {
	display: flex;
	gap: 12rpx;
}
.mini-tag {
	font-size: 20rpx;
	color: #8B7355;
	padding: 4rpx 12rpx;
	background: #F5F1E8;
	border-radius: 8rpx;
}
.fav-icon {
	font-size: 36rpx;
	color: #D4C9B5;
	line-height: 1;
}
.fav-icon.active {
	color: #C0392B;
}

/* ========== 底部操作栏（避让 TabBar + 安全区） ========== */
.bottom-bar {
	position: fixed;
	bottom: calc(50px + constant(safe-area-inset-bottom));
	bottom: calc(50px + env(safe-area-inset-bottom));
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-top: 1rpx solid #E8E0D0;
	z-index: 99;
}
.bottom-action {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 24rpx;
}
.bottom-text {
	font-size: 28rpx;
	color: #1A1A1A;
}
.delete-btn {
	background: #C0392B;
	border-radius: 40rpx;
	padding: 16rpx 48rpx;
}
.delete-btn .bottom-text {
	color: #FFFFFF;
}
.delete-btn.disabled {
	background: #D4C9B5;
}

/* ========== 空状态 ========== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 64rpx;
	min-height: 60vh;
}
.empty-img {
	width: 240rpx;
	height: 240rpx;
	margin-bottom: 32rpx;
	opacity: 0.6;
}
.empty-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #4A4A4A;
	margin-bottom: 12rpx;
}
.empty-desc {
	font-size: 26rpx;
	color: #8B7355;
	margin-bottom: 48rpx;
}
.empty-btn {
	padding: 20rpx 64rpx;
	background: linear-gradient(135deg, #C0392B, #922B21);
	border-radius: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(192, 57, 43, 0.3);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.empty-btn:active {
	transform: scale(0.97);
}
.empty-btn-text {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: 500;
}
</style>
