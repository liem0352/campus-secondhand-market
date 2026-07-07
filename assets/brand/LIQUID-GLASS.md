# 校园易物 · Liquid Glass 设计系统（跨平台落地版）

> 本设计系统将 iOS 26+ Liquid Glass 的视觉语言，跨平台落地到：
> - **frontend-web**（Vue 3 + Element Plus，C 端 H5）
> - **frontend-admin**（Vue 3 + Element Plus，B 端管理后台）
> - **miniprogram**（微信小程序，C 端）

---

## 1. 设计语言原则

| 原则 | 实现手段 |
|---|---|
| **半透磨砂（半透 + 模糊）** | 浅色 / 深色半透底 + `backdrop-filter: blur(24px)`（Web）/ 半透 + 多层阴影（小程序） |
| **边缘高光（折光）** | `inset 0 1px 0 rgba(255,255,255,0.5)` 顶部白色高光 |
| **分层深度（3 档 elevation）** | `glass-shadow-1` / `-2` / `-3` 三档阴影 |
| **内容优先** | 底层是径向 / 线性渐变色，玻璃只承载 UI |
| **可降级** | `@supports not (backdrop-filter)` 自动回退到纯色 |

---

## 2. 平台实现差异

| 特性 | Web（Vue） | 小程序 |
|---|---|---|
| **backdrop-filter** | ✅ 完整支持 | ❌ 不支持 |
| **主模糊** | `saturate(180%) blur(24px)` | 用半透实色 + 边框 + 多层阴影模拟 |
| **浮起感** | `box-shadow` + `border` | `box-shadow` + 内嵌 `inset 0 1rpx 0` 高光 |
| **动画** | `transform` + `transition` | `transform: scale(0.98)` + `transition` |
| **设计 Token** | `var(--glass-*)` | `var(--glass-*)` (rpx 单位) |

---

## 3. 设计 Token 一览

### 玻璃表面（半透白）
```
--glass-light-1: rgba(255, 255, 255, 0.45)  // 弱化
--glass-light-2: rgba(255, 255, 255, 0.6)   // 标准
--glass-light-3: rgba(255, 255, 255, 0.78)  // 强调
--glass-light-4: rgba(255, 255, 255, 0.92)  // 最高
```

### 玻璃表面（半透深）
```
--glass-dark-1: rgba(28, 28, 30, 0.42)
--glass-dark-2: rgba(28, 28, 30, 0.58)
--glass-dark-3: rgba(28, 28, 30, 0.72)
```

### 模糊度
```
--glass-blur:        saturate(180%) blur(24px)    // 通用
--glass-blur-soft:   saturate(160%) blur(14px)    // 副层
--glass-blur-strong: saturate(200%) blur(36px)    // 顶栏
```

### 边缘高光
```
--glass-highlight:        inset 0 1px 0 rgba(255, 255, 255, 0.5)
--glass-highlight-soft:   inset 0 1px 0 rgba(255, 255, 255, 0.28)
--glass-highlight-dark:   inset 0 1px 0 rgba(255, 255, 255, 0.08)
```

### 阴影（3 档）
```
--glass-shadow-1: 0 4px 12px rgba(0, 0, 0, 0.06)             // 轻
--glass-shadow-2: 0 8px 28px rgba(0, 0, 0, 0.1)              // 中
--glass-shadow-3: 0 18px 48px rgba(0, 0, 0, 0.16)            // 重
--glass-shadow-orange: 0 12px 32px rgba(242, 92, 42, 0.32)  // 主色
```

### 圆角
```
--glass-radius-sm: 12px
--glass-radius-md: 18px
--glass-radius-lg: 24px
--glass-radius-xl: 32px
--glass-radius-pill: 999px
```

---

## 4. 工具类

| 类名 | 用途 | 适用 |
|---|---|---|
| `.glass` / `.glass-light` | 标准玻璃卡（浅色背景） | Web / 小程序 |
| `.glass-dark` | 深色玻璃卡 | Web / 小程序 |
| `.glass-soft` | 弱化玻璃（tooltip / 副层） | Web |
| `.glass-strong` | 强玻璃（更"实"的卡片） | 小程序 |
| `.glass-tint` / `.glass-primary` | 主色玻璃（按钮 / 强调） | Web / 小程序 |
| `.glass-btn` | 玻璃按钮 | Web |
| `.glass-input` | 玻璃输入框 | Web |
| `.glass-sticky` | 粘性玻璃层（顶栏） | Web |
| `.glass-divider` | 玻璃分割线 | Web / 小程序 |

---

## 5. 已改造页面清单

### frontend-web（H5 C 端，端口 3000）
- ✅ **登录页**（`Login.vue`）：橙色径向渐变背景 + 漂浮光斑 + 玻璃主卡 + 玻璃输入框
- ✅ **顶栏**（`MainLayout.vue`）：粘性玻璃层（`glass-blur-strong` 36px）
- ✅ **信用分胶囊**：玻璃 pill + 内嵌高光
- ✅ **设计 Token**：新建 `src/styles/liquid-glass.css`

### frontend-admin（管理后台 B 端，端口 5173）
- ✅ **登录页**：冷蓝紫色径向渐变 + 玻璃主卡 + 玻璃输入框
- ✅ **顶栏**：粘性玻璃层
- ✅ **设计 Token**：新建 `src/styles/liquid-glass.css`（冷色版）

### miniprogram（微信小程序 C 端）
- ✅ **app.wxss**：新增 Liquid Glass Token + 4 个工具类
- ✅ **登录页**（`login.wxss`）：玻璃登录卡 + 玻璃主按钮
- ✅ **首页**（`home.wxss`）：Hero 渐变 Banner 玻璃化 + 搜索框玻璃化
- ✅ **发布页**（`publish.wxss`）：AI Banner 玻璃化
- ✅ **底部 Tab Bar**（`custom-tab-bar/index.wxss`）：半透明白玻璃

---

## 6. 跨端一致性保证

- **统一 Logo**：`assets/brand/logo-mark.svg`（含底部磨砂遮罩）
- **统一版权**：`© liem`
- **统一设计语言**：3 端共享玻璃 Token 的命名与层级
- **统一品牌主色**：三端（3000 H5 / 5173 Admin / 小程序）一律 `#FF6B35` 暖橙，
  Liquid Glass 系统不再做冷暖区分，避免视觉割裂

---

## 7. 后续可优化方向

- [ ] Dashboard 页面卡片全面 Liquid Glass 化
- [ ] 商品详情页大图遮罩用毛玻璃
- [ ] 消息中心气泡用玻璃圆角
- [ ] Settings / Profile 页面设置项分组用玻璃层分隔
- [ ] 添加 prefers-reduced-motion 降级（自动减弱动画）
- [ ] 性能监控：backdrop-filter 在低端机可能掉帧，必要时降级
