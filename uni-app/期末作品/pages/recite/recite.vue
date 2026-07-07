<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content" :style="{ height: navContentHeight + 'px', paddingLeft: (menuRight + menuWidth + 8) + 'px', paddingRight: (menuRight + menuWidth + 8) + 'px' }">
				<view class="nav-back" @tap="goBack" v-if="mode !== 'select'">
					<view class="back-arrow"></view>
				</view>
				<view class="nav-back" @tap="resetToSelect" v-else>
					<view class="back-arrow"></view>
				</view>
				<text class="nav-title">{{ navTitle }}</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>
		<view :style="{ height: navBarHeight + 'px' }"></view>

		<!-- 选择模式 -->
		<scroll-view scroll-y="true" class="content-scroll" :style="{ height: scrollHeight }" v-if="mode === 'select'">
			<!-- 模式选择卡片 -->
			<view class="mode-section anim-fade-in-up">
				<text class="section-label">选择练习方式</text>
				<view class="mode-cards">
					<view class="mode-card" @tap="selectMode('fill')">
						<view class="mode-icon fill-icon">
							<view class="icon-line"></view>
							<view class="icon-line short"></view>
							<view class="icon-line"></view>
						</view>
						<text class="mode-name">填空背诵</text>
						<text class="mode-desc">补全诗句空缺</text>
					</view>
					<view class="mode-card" @tap="selectMode('quiz')">
						<view class="mode-icon quiz-icon">
							<view class="icon-q"></view>
						</view>
						<text class="mode-name">趣味测验</text>
						<text class="mode-desc">选择题挑战</text>
					</view>
				</view>
			</view>

			<!-- 诗词选择列表 -->
			<view class="poem-list-section anim-fade-in-up delay-1">
				<view class="section-header">
					<text class="section-label">选择诗词</text>
					<text class="section-count">共 {{ recitePoems.length }} 首</text>
				</view>
				<view class="poem-select-list">
					<view class="poem-select-item anim-fade-in-up" 
						v-for="(poem, i) in recitePoems" 
						:key="poem.id"
						:class="delayClasses[i % 5]"
						@tap="startPractice(poem)">
						<view class="poem-num">{{ i < 9 ? '0' + (i + 1) : (i + 1) }}</view>
						<view class="poem-info">
							<text class="poem-title">{{ poem.title }}</text>
							<text class="poem-meta">{{ poem.dynasty }} · {{ poem.author }} · {{ poem.type }}</text>
						</view>
						<view class="poem-arrow"></view>
					</view>
				</view>
			</view>

			<!-- 学习统计 -->
			<view class="stats-card anim-fade-in-up delay-3" v-if="stats.reciteCount > 0">
				<text class="stats-title">学习统计</text>
				<view class="stats-grid">
					<view class="stats-item">
						<text class="stats-num">{{ stats.reciteCount }}</text>
						<text class="stats-label">背诵次数</text>
					</view>
					<view class="stats-divider"></view>
					<view class="stats-item">
						<text class="stats-num">{{ stats.avgAccuracy }}%</text>
						<text class="stats-label">平均正确率</text>
					</view>
					<view class="stats-divider"></view>
					<view class="stats-item">
						<text class="stats-num">{{ stats.studiedPoems }}</text>
						<text class="stats-label">已学诗词</text>
					</view>
				</view>
			</view>

			<!-- 底部避让占位 -->
			<view :style="{ height: (50 + safeAreaBottom + 20) + 'px' }"></view>
		</scroll-view>

		<!-- 填空练习模式 -->
		<view class="practice-container" :style="{ minHeight: scrollHeight }" v-else-if="mode === 'fill'">
			<!-- 进度条 -->
			<view class="progress-bar-wrap">
				<view class="progress-info">
					<text class="progress-text">第 {{ currentIdx + 1 }} / {{ totalQuestions }} 题</text>
					<text class="progress-score">得分 {{ score }}</text>
				</view>
				<view class="progress-track">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
			</view>

			<!-- 题目区 -->
			<view class="question-card anim-fade-in-scale" :key="currentIdx">
				<view class="poem-title-bar">
					<text class="q-poem-title">{{ currentPoem.title }}</text>
					<text class="q-poem-author">{{ currentPoem.dynasty }} · {{ currentPoem.author }}</text>
				</view>
				<view class="poem-fill-area">
					<view class="fill-line" v-for="(line, li) in fillLines" :key="li">
						<block v-for="(seg, si) in line" :key="si">
							<text class="fill-text" v-if="seg.type === 'text'">{{ seg.text }}</text>
							<input class="fill-input" 
								v-else
								:maxlength="seg.length"
								v-model="seg.value"
								:placeholder="seg.placeholder"
								placeholder-class="fill-placeholder"
								@input="checkFillAnswer"
								:focus="seg.focus" />
						</block>
					</view>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="practice-actions">
				<view class="action-btn-secondary" @tap="skipQuestion">
					<text class="btn-text">跳过</text>
				</view>
				<view class="action-btn-primary" :class="{ disabled: !canSubmit }" @tap="submitFillAnswer">
					<text class="btn-text">提交</text>
				</view>
			</view>
		</view>

		<!-- 测验模式 -->
		<view class="practice-container" :style="{ minHeight: scrollHeight }" v-else-if="mode === 'quiz'">
			<!-- 进度条 -->
			<view class="progress-bar-wrap">
				<view class="progress-info">
					<text class="progress-text">第 {{ currentIdx + 1 }} / {{ totalQuestions }} 题</text>
					<text class="progress-score">得分 {{ score }}</text>
				</view>
				<view class="progress-track">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
			</view>

			<!-- 题目卡片 -->
			<view class="quiz-card anim-fade-in-scale" :key="currentIdx">
				<view class="quiz-tag">{{ currentQuestion.type }}</view>
				<text class="quiz-question">{{ currentQuestion.question }}</text>
				<view class="quiz-options">
					<view class="quiz-option" 
						v-for="(opt, i) in currentQuestion.options" 
						:key="i"
						:class="{ correct: selectedOption !== null && i === currentQuestion.answer, wrong: selectedOption !== null && i === selectedOption && i !== currentQuestion.answer, disabled: selectedOption !== null && i !== currentQuestion.answer && i !== selectedOption }"
						@tap="selectOption(i)">
						<view class="option-marker">{{ ['A','B','C','D'][i] }}</view>
						<text class="option-text">{{ opt }}</text>
						<view class="option-icon" v-if="selectedOption !== null">
							<view class="icon-correct" v-if="i === currentQuestion.answer"></view>
							<view class="icon-wrong" v-else-if="i === selectedOption"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 下一题按钮 -->
			<view class="practice-actions" v-if="selectedOption !== null">
				<view class="action-btn-primary" @tap="nextQuestion">
					<text class="btn-text">{{ currentIdx + 1 >= totalQuestions ? '查看结果' : '下一题' }}</text>
				</view>
			</view>
		</view>

		<!-- 结果页 -->
		<view class="result-container anim-spring-in" v-else-if="mode === 'result'">
			<view class="result-circle">
				<view class="result-circle-bg"></view>
				<text class="result-score">{{ finalScore }}</text>
				<text class="result-label">总分</text>
			</view>
			<text class="result-title">{{ resultTitle }}</text>
			<text class="result-subtitle">{{ resultSubtitle }}</text>

			<view class="result-stats">
				<view class="result-stat-item">
					<text class="rs-num">{{ correctCount }}</text>
					<text class="rs-label">答对</text>
				</view>
				<view class="result-stat-divider"></view>
				<view class="result-stat-item">
					<text class="rs-num">{{ totalQuestions - correctCount }}</text>
					<text class="rs-label">答错</text>
				</view>
				<view class="result-stat-divider"></view>
				<view class="result-stat-item">
					<text class="rs-num">{{ accuracy }}%</text>
					<text class="rs-label">正确率</text>
				</view>
			</view>

			<view class="result-actions">
				<view class="action-btn-secondary" @tap="resetToSelect">
					<text class="btn-text">返回选择</text>
				</view>
				<view class="action-btn-primary" @tap="retryPractice">
					<text class="btn-text">再来一次</text>
				</view>
			</view>
		</view>
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
				mode: 'select', // select / fill / quiz / result
				practiceMode: '', // fill / quiz
				recitePoems: [],
				delayClasses: ['delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6'],
				currentPoem: {},
				currentIdx: 0,
				totalQuestions: 5,
				score: 0,
				correctCount: 0,
				// 填空相关
				fillLines: [],
				canSubmit: false,
				// 测验相关
				questions: [],
				currentQuestion: {},
				selectedOption: null,
				// 结果
				finalScore: 0,
				accuracy: 0,
				// 统计
				stats: {
					reciteCount: 0,
					avgAccuracy: 0,
					studiedPoems: 0
				}
			};
		},
		computed: {
			navTitle() {
				const map = {
					select: '背诵练习',
					fill: '填空背诵',
					quiz: '趣味测验',
					result: '练习结果'
				};
				return map[this.mode] || '背诵练习';
			},
			progressPercent() {
				return this.totalQuestions > 0 ? ((this.currentIdx) / this.totalQuestions * 100) : 0;
			},
			resultTitle() {
				if (this.accuracy >= 90) return '才高八斗';
				if (this.accuracy >= 75) return '学富五车';
				if (this.accuracy >= 60) return '初窥门径';
				return '仍需努力';
			},
			resultSubtitle() {
				if (this.accuracy >= 90) return '诗词功底深厚，堪称大家';
				if (this.accuracy >= 75) return '掌握扎实，再接再厉';
				if (this.accuracy >= 60) return '已有基础，继续修炼';
				return '多读多背，必有所成';
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
			this.scrollHeight = 'calc(100vh - ' + navInfo.navBarHeight + 'px - 50px - ' + navInfo.safeAreaBottom + 'px)';
			this.loadRecitePoems();
			this.loadStats();
			// 从详情页跳转携带 poemId
			if (options.poemId) {
				const poemId = parseInt(options.poemId);
				const poem = util.getPoemById(poemId, poems);
				if (poem) {
					// 默认进入填空模式
					this.selectMode('fill');
					this.$nextTick(() => {
						this.startPractice(poem);
					});
				}
			}
		},
		onShow() {
			this.loadStats();
		},
		methods: {
			/**
			 * 加载可背诵诗词列表
			 */
			loadRecitePoems() {
				this.recitePoems = util.getRecitePoems(poems);
			},
			/**
			 * 加载学习统计
			 */
			loadStats() {
				this.stats = util.getStudyStats();
			},
			/**
			 * 选择练习模式
			 */
			selectMode(m) {
				this.practiceMode = m;
				this.mode = 'select';
				util.showToast(m === 'fill' ? '已选择填空模式，请选诗词' : '已选择测验模式，请选诗词');
			},
			/**
			 * 开始练习
			 */
			startPractice(poem) {
				this.currentPoem = poem;
				this.currentIdx = 0;
				this.score = 0;
				this.correctCount = 0;
				if (this.practiceMode === 'fill') {
					this.initFillPractice(poem);
					this.mode = 'fill';
				} else if (this.practiceMode === 'quiz') {
					this.initQuizPractice(poem);
					this.mode = 'quiz';
				} else {
					// 默认填空
					this.practiceMode = 'fill';
					this.initFillPractice(poem);
					this.mode = 'fill';
				}
			},
			/**
			 * 初始化填空练习
			 */
			initFillPractice(poem) {
				const lines = poem.content.split('\n');
				// 选择 1-2 行做填空
				const fillLineCount = Math.min(2, lines.length);
				const fillLineIndices = [];
				while (fillLineIndices.length < fillLineCount) {
					const idx = Math.floor(Math.random() * lines.length);
					if (fillLineIndices.indexOf(idx) === -1) {
						fillLineIndices.push(idx);
					}
				}
				this.totalQuestions = fillLineIndices.length;
				this.fillLines = lines.map((line, li) => {
					if (fillLineIndices.indexOf(li) === -1) {
						return [{ type: 'text', text: line }];
					}
					// 在该行随机挖空 2-3 个字
					const chars = line.split('');
					const blankCount = Math.min(3, Math.max(1, Math.floor(chars.length / 5)));
					const blankIndices = [];
					while (blankIndices.length < blankCount) {
						const idx = Math.floor(Math.random() * chars.length);
						if (chars[idx] !== '，' && chars[idx] !== '。' && chars[idx] !== '？' 
							&& chars[idx] !== '！' && chars[idx] !== '、' && blankIndices.indexOf(idx) === -1) {
							blankIndices.push(idx);
						}
					}
					blankIndices.sort((a, b) => a - b);
					// 合并相邻空格
					const segments = [];
					let lastIdx = -1;
					let textBuffer = '';
					for (let i = 0; i < chars.length; i++) {
						if (blankIndices.indexOf(i) > -1) {
							if (textBuffer) {
								segments.push({ type: 'text', text: textBuffer });
								textBuffer = '';
							}
							// 检查是否与上一个空相邻
							if (segments.length > 0 && segments[segments.length - 1].type === 'blank') {
								segments[segments.length - 1].length += 1;
								segments[segments.length - 1].answer += chars[i];
								segments[segments.length - 1].value = '';
							} else {
								segments.push({
									type: 'blank',
									length: 1,
									answer: chars[i],
									value: '',
									placeholder: '＿',
									focus: false
								});
							}
						} else {
							textBuffer += chars[i];
						}
					}
					if (textBuffer) {
						segments.push({ type: 'text', text: textBuffer });
					}
					return segments;
				});
				this.canSubmit = false;
			},
			/**
			 * 检查填空答案是否已填完
			 */
			checkFillAnswer() {
				let allFilled = true;
				this.fillLines.forEach(line => {
					line.forEach(seg => {
						if (seg.type === 'blank' && !seg.value) {
							allFilled = false;
						}
					});
				});
				this.canSubmit = allFilled;
			},
			/**
			 * 提交填空答案
			 */
			submitFillAnswer() {
				if (!this.canSubmit) return;
				let correct = true;
				this.fillLines.forEach(line => {
					line.forEach(seg => {
						if (seg.type === 'blank') {
							if (seg.value !== seg.answer) {
								correct = false;
							}
						}
					});
				});
				if (correct) {
					this.score += 20;
					this.correctCount++;
					util.showToast('回答正确', 'success');
				} else {
					util.showToast('回答错误，再接再厉');
				}
				setTimeout(() => {
					this.nextQuestion();
				}, 1200);
			},
			/**
			 * 跳过当前题
			 */
			skipQuestion() {
				util.showToast('已跳过本题');
				setTimeout(() => {
					this.nextQuestion();
				}, 500);
			},
			/**
			 * 初始化测验练习
			 */
			initQuizPractice(poem) {
				const allQuestions = this.generateQuestions(poem);
				// 随机抽取5题
				const shuffled = allQuestions.sort(() => Math.random() - 0.5);
				this.questions = shuffled.slice(0, 5);
				this.totalQuestions = this.questions.length;
				this.currentQuestion = this.questions[0];
				this.selectedOption = null;
			},
			/**
			 * 生成测验题目
			 */
			generateQuestions(poem) {
				const questions = [];
				// 题型1：作者
				const otherAuthors = poems.filter(p => p.author !== poem.author).map(p => p.author);
				const wrongAuthors = this.shuffleArray(otherAuthors).slice(0, 3);
				questions.push({
					type: '文学常识',
					question: `《${poem.title}》的作者是谁？`,
					options: this.shuffleArray([poem.author, ...wrongAuthors]),
					answer: 0
				});
				// 修正 answer 索引
				questions[0].answer = questions[0].options.indexOf(poem.author);

				// 题型2：朝代
				const dynasties = ['唐', '宋', '元', '明', '清'];
				const wrongDynasties = dynasties.filter(d => d !== poem.dynasty).slice(0, 3);
				questions.push({
					type: '文学常识',
					question: `《${poem.title}》属于哪个朝代的作品？`,
					options: this.shuffleArray([poem.dynasty, ...wrongDynasties]),
					answer: 0
				});
				questions[1].answer = questions[1].options.indexOf(poem.dynasty);

				// 题型3：体裁
				const allTypes = ['五言绝句', '七言绝句', '五言律诗', '五言古诗', '词', '乐府诗'];
				const wrongTypes = allTypes.filter(t => t !== poem.type).slice(0, 3);
				questions.push({
					type: '体裁分类',
					question: `《${poem.title}》属于哪种体裁？`,
					options: this.shuffleArray([poem.type, ...wrongTypes]),
					answer: 0
				});
				questions[2].answer = questions[2].options.indexOf(poem.type);

				// 题型4：注释
				if (poem.annotation && poem.annotation.length > 0) {
					const ann = poem.annotation[0];
					const otherMeanings = poems.flatMap(p => 
						(p.annotation || []).filter(a => a.word !== ann.word).map(a => a.meaning)
					);
					const wrongMeanings = this.shuffleArray(otherMeanings).slice(0, 3);
					questions.push({
						type: '字词解释',
						question: `"${ann.word}"在诗中的意思是？`,
						options: this.shuffleArray([ann.meaning, ...wrongMeanings]),
						answer: 0
					});
					questions[questions.length - 1].answer = questions[questions.length - 1].options.indexOf(ann.meaning);
				}

				// 题型5：诗句填空
				const lines = poem.content.split('\n').filter(l => l.length > 4);
				if (lines.length > 0) {
					const line = lines[Math.floor(Math.random() * lines.length)];
					const chars = line.split('');
					const blankIdx = Math.floor(Math.random() * chars.length);
					while (chars[blankIdx] === '，' || chars[blankIdx] === '。' || chars[blankIdx] === '？') {
						blankIdx = Math.floor(Math.random() * chars.length);
					}
					const answerChar = chars[blankIdx];
					const questionLine = chars.map((c, i) => i === blankIdx ? '＿' : c).join('');
					// 从其他诗词中取干扰项
					const otherChars = poems.flatMap(p => p.content.split('')).filter(c => 
						c !== answerChar && c !== '，' && c !== '。' && c !== '？' && c !== '！' && c !== '\n' && c !== '、'
					);
					const wrongChars = this.shuffleArray([...new Set(otherChars)]).slice(0, 3);
					questions.push({
						type: '诗句填空',
						question: `补全诗句：${questionLine}`,
						options: this.shuffleArray([answerChar, ...wrongChars]),
						answer: 0
					});
					questions[questions.length - 1].answer = questions[questions.length - 1].options.indexOf(answerChar);
				}

				// 题型6：主题
				const allThemes = ['思乡', '春天', '冬天', '壮志', '思亲', '惜春', '哲理', '相思', '送别', '豪放', '忧国', '田园'];
				const wrongThemes = allThemes.filter(t => t !== poem.theme).slice(0, 3);
				questions.push({
					type: '主题分类',
					question: `《${poem.title}》的主要主题是？`,
					options: this.shuffleArray([poem.theme, ...wrongThemes]),
					answer: 0
				});
				questions[questions.length - 1].answer = questions[questions.length - 1].options.indexOf(poem.theme);

				return questions;
			},
			/**
			 * 数组随机打乱
			 */
			shuffleArray(arr) {
				const a = [...arr];
				for (let i = a.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[a[i], a[j]] = [a[j], a[i]];
				}
				return a;
			},
			/**
			 * 选择选项
			 */
			selectOption(i) {
				if (this.selectedOption !== null) return;
				this.selectedOption = i;
				if (i === this.currentQuestion.answer) {
					this.score += 20;
					this.correctCount++;
				}
			},
			/**
			 * 下一题
			 */
			nextQuestion() {
				if (this.currentIdx + 1 >= this.totalQuestions) {
					this.showResult();
				} else {
					this.currentIdx++;
					if (this.practiceMode === 'fill') {
						// 填空模式：重新生成空
						this.initFillPractice(this.currentPoem);
						this.canSubmit = false;
					} else {
						this.currentQuestion = this.questions[this.currentIdx];
						this.selectedOption = null;
					}
				}
			},
			/**
			 * 显示结果
			 */
			showResult() {
				this.finalScore = this.score;
				this.accuracy = this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
				this.mode = 'result';
				// 保存背诵记录
				if (this.currentPoem.id) {
					util.saveReciteRecord(this.currentPoem.id, this.correctCount, this.totalQuestions);
					this.loadStats();
				}
			},
			/**
			 * 重试练习
			 */
			retryPractice() {
				this.startPractice(this.currentPoem);
			},
			/**
			 * 重置到选择页
			 */
			resetToSelect() {
				this.mode = 'select';
				this.currentIdx = 0;
				this.score = 0;
				this.correctCount = 0;
				this.selectedOption = null;
				this.canSubmit = false;
			},
			/**
			 * 返回上一页
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
.nav-back, .nav-placeholder {
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

/* ========== 内容滚动 ========== */
.content-scroll {
	box-sizing: border-box;
}

/* ========== 选择模式 ========== */
.mode-section {
	padding: 32rpx;
}
.section-label {
	font-size: 28rpx;
	font-weight: 600;
	color: #4A4A4A;
	margin-bottom: 24rpx;
	display: block;
}
.mode-cards {
	display: flex;
	gap: 24rpx;
}
.mode-card {
	flex: 1;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 36rpx 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.mode-card:active {
	transform: scale(0.97);
	border-color: #C0392B;
}
.mode-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: #FBEAE7;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
	position: relative;
}
.fill-icon {
	background: linear-gradient(135deg, #FBEAE7, #F5D5D0);
}
.icon-line {
	width: 48rpx;
	height: 4rpx;
	background: #C0392B;
	border-radius: 2rpx;
	margin: 4rpx 0;
}
.icon-line.short {
	width: 28rpx;
	background: #B8860B;
}
.quiz-icon {
	background: linear-gradient(135deg, #FBEAE7, #F5D5D0);
}
.icon-q {
	width: 32rpx;
	height: 32rpx;
	border: 4rpx solid #C0392B;
	border-radius: 50%;
	position: relative;
}
.icon-q::after {
	content: '';
	position: absolute;
	bottom: -8rpx;
	right: -4rpx;
	width: 12rpx;
	height: 4rpx;
	background: #C0392B;
	transform: rotate(45deg);
}
.mode-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-bottom: 8rpx;
}
.mode-desc {
	font-size: 22rpx;
	color: #8B7355;
}

/* ========== 诗词选择列表 ========== */
.poem-list-section {
	padding: 0 32rpx 32rpx;
}
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}
.section-count {
	font-size: 24rpx;
	color: #8B7355;
}
.poem-select-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.poem-select-item {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 28rpx 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(26, 26, 26, 0.04);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.poem-select-item:active {
	transform: scale(0.98);
	background: #FAF7F0;
}
.poem-num {
	font-size: 36rpx;
	font-weight: 700;
	color: #D4C9B5;
	font-family: 'STSong', serif;
	margin-right: 24rpx;
	min-width: 56rpx;
}
.poem-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}
.poem-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-bottom: 6rpx;
}
.poem-meta {
	font-size: 22rpx;
	color: #8B7355;
}
.poem-arrow {
	width: 16rpx;
	height: 16rpx;
	border-top: 4rpx solid #B8A88A;
	border-right: 4rpx solid #B8A88A;
	transform: rotate(45deg);
}

/* ========== 统计卡片 ========== */
.stats-card {
	margin: 0 32rpx 48rpx;
	background: linear-gradient(135deg, #2C3E50, #1A1A1A);
	border-radius: 24rpx;
	padding: 32rpx;
}
.stats-title {
	font-size: 26rpx;
	color: #D4A017;
	margin-bottom: 24rpx;
	display: block;
}
.stats-grid {
	display: flex;
	align-items: center;
}
.stats-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.stats-num {
	font-size: 44rpx;
	font-weight: 700;
	color: #FAF7F0;
	font-family: 'STSong', serif;
}
.stats-label {
	font-size: 22rpx;
	color: #B8A88A;
	margin-top: 8rpx;
}
.stats-divider {
	width: 1rpx;
	height: 60rpx;
	background: rgba(184, 168, 138, 0.3);
}

/* ========== 练习容器 ========== */
.practice-container {
	padding: 32rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

/* ========== 进度条 ========== */
.progress-bar-wrap {
	margin-bottom: 40rpx;
}
.progress-info {
	display: flex;
	justify-content: space-between;
	margin-bottom: 16rpx;
}
.progress-text {
	font-size: 26rpx;
	color: #4A4A4A;
	font-weight: 500;
}
.progress-score {
	font-size: 26rpx;
	color: #C0392B;
	font-weight: 600;
}
.progress-track {
	height: 8rpx;
	background: #EDE7D8;
	border-radius: 4rpx;
	overflow: hidden;
}
.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #C0392B, #E74C3C);
	border-radius: 4rpx;
	transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ========== 填空题 ========== */
.question-card {
	background: #FFFFFF;
	border-radius: 32rpx;
	padding: 48rpx 32rpx;
	box-shadow: 0 8rpx 32rpx rgba(26, 26, 26, 0.08);
	margin-bottom: 32rpx;
}
.poem-title-bar {
	text-align: center;
	margin-bottom: 40rpx;
	padding-bottom: 24rpx;
	border-bottom: 1rpx dashed #D4C9B5;
}
.q-poem-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
	display: block;
	margin-bottom: 12rpx;
}
.q-poem-author {
	font-size: 24rpx;
	color: #8B7355;
}
.poem-fill-area {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.fill-line {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	line-height: 1.8;
	font-family: 'STSong', serif;
	color: #1A1A1A;
}
.fill-text {
	color: #1A1A1A;
}
.fill-input {
	min-width: 48rpx;
	height: 56rpx;
	border-bottom: 3rpx solid #C0392B;
	text-align: center;
	font-size: 36rpx;
	color: #C0392B;
	font-weight: 600;
	font-family: 'STSong', serif;
	margin: 0 4rpx;
	background: transparent;
}
.fill-placeholder {
	color: #D4C9B5;
	font-weight: 400;
}

/* ========== 测验题 ========== */
.quiz-card {
	background: #FFFFFF;
	border-radius: 32rpx;
	padding: 40rpx 32rpx;
	box-shadow: 0 8rpx 32rpx rgba(26, 26, 26, 0.08);
	margin-bottom: 32rpx;
}
.quiz-tag {
	display: inline-block;
	padding: 6rpx 20rpx;
	background: #FBEAE7;
	color: #C0392B;
	font-size: 22rpx;
	border-radius: 20rpx;
	margin-bottom: 24rpx;
	font-weight: 500;
}
.quiz-question {
	font-size: 34rpx;
	font-weight: 600;
	color: #1A1A1A;
	line-height: 1.6;
	margin-bottom: 32rpx;
	display: block;
}
.quiz-options {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.quiz-option {
	display: flex;
	align-items: center;
	padding: 28rpx 24rpx;
	background: #FAF7F0;
	border-radius: 20rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.quiz-option:active {
	transform: scale(0.98);
}
.quiz-option.correct {
	background: rgba(44, 95, 74, 0.08);
	border-color: #2C5F4A;
}
.quiz-option.wrong {
	background: rgba(192, 57, 43, 0.08);
	border-color: #C0392B;
}
.quiz-option.disabled {
	opacity: 0.5;
}
.option-marker {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: #FFFFFF;
	border: 2rpx solid #D4C9B5;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	font-weight: 600;
	color: #8B7355;
	margin-right: 20rpx;
	flex-shrink: 0;
}
.quiz-option.correct .option-marker {
	background: #2C5F4A;
	border-color: #2C5F4A;
	color: #FFFFFF;
}
.quiz-option.wrong .option-marker {
	background: #C0392B;
	border-color: #C0392B;
	color: #FFFFFF;
}
.option-text {
	flex: 1;
	font-size: 30rpx;
	color: #1A1A1A;
}
.option-icon {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.icon-correct {
	width: 24rpx;
	height: 12rpx;
	border-left: 4rpx solid #2C5F4A;
	border-bottom: 4rpx solid #2C5F4A;
	transform: rotate(-45deg);
	margin-top: -8rpx;
}
.icon-wrong {
	position: relative;
	width: 28rpx;
	height: 28rpx;
}
.icon-wrong::before, .icon-wrong::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 32rpx;
	height: 4rpx;
	background: #C0392B;
	border-radius: 2rpx;
}
.icon-wrong::before {
	transform: translate(-50%, -50%) rotate(45deg);
}
.icon-wrong::after {
	transform: translate(-50%, -50%) rotate(-45deg);
}

/* ========== 操作按钮 ========== */
.practice-actions {
	display: flex;
	gap: 24rpx;
	margin-top: auto;
	padding-top: 32rpx;
}
.action-btn-primary {
	flex: 1;
	height: 96rpx;
	background: linear-gradient(135deg, #C0392B, #922B21);
	border-radius: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(192, 57, 43, 0.3);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.action-btn-primary:active {
	transform: scale(0.97);
}
.action-btn-primary.disabled {
	background: #D4C9B5;
	box-shadow: none;
}
.action-btn-secondary {
	flex: 1;
	height: 96rpx;
	background: #FFFFFF;
	border: 2rpx solid #D4C9B5;
	border-radius: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.action-btn-secondary:active {
	transform: scale(0.97);
	background: #FAF7F0;
}
.btn-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #FFFFFF;
}
.action-btn-secondary .btn-text {
	color: #4A4A4A;
}

/* ========== 结果页 ========== */
.result-container {
	padding: 64rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
}
.result-circle {
	position: relative;
	width: 280rpx;
	height: 280rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin-bottom: 40rpx;
}
.result-circle-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	border-radius: 50%;
	background: linear-gradient(135deg, #FBEAE7, #F5D5D0);
	border: 8rpx solid #C0392B;
}
.result-score {
	font-size: 96rpx;
	font-weight: 700;
	color: #C0392B;
	font-family: 'STSong', serif;
	position: relative;
	z-index: 1;
	line-height: 1;
}
.result-label {
	font-size: 24rpx;
	color: #8B7355;
	margin-top: 8rpx;
	position: relative;
	z-index: 1;
}
.result-title {
	font-size: 48rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
	margin-bottom: 16rpx;
}
.result-subtitle {
	font-size: 26rpx;
	color: #8B7355;
	margin-bottom: 48rpx;
	text-align: center;
}
.result-stats {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx 48rpx;
	box-shadow: 0 4rpx 16rpx rgba(26, 26, 26, 0.06);
	margin-bottom: 48rpx;
}
.result-stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 140rpx;
}
.rs-num {
	font-size: 44rpx;
	font-weight: 700;
	color: #1A1A1A;
	font-family: 'STSong', serif;
}
.rs-label {
	font-size: 22rpx;
	color: #8B7355;
	margin-top: 8rpx;
}
.result-stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: #E8E0D0;
	margin: 0 16rpx;
}
.result-actions {
	display: flex;
	gap: 24rpx;
	width: 100%;
}
</style>
