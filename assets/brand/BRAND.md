# 校园易物 · 品牌识别手册

## 1. 品牌定位

| 项目 | 内容 |
|---|---|
| 中文名 | 校园易物 |
| 英文名 | Campus Exchange |
| 品牌主张 | 让闲置在校园里流动起来 |
| 目标用户 | 大学生 / 研究生 |
| 业务模型 | C2C 闲置交易 + 信用分体系 |

## 2. Logo 标识

### 2.1 核心隐喻
"**易**" = 交换、流转 —— 图形化为两段弧线首尾相接形成的循环。

### 2.2 形态结构
- **底板**：圆角方形（rx: 14/64 = 22%），主色填充
- **主体**：上下两段半弧 + 箭头，方向相反，形成完整旋转
- **点睛**：中心一个微小白点，象征"物"
- **底部磨砂遮罩**：从顶部 4% 透明度渐变到底部 34% 透明度，营造"玻璃底部蒙霜"质感

### 2.3 资产清单

| 文件 | 用途 | 尺寸 | 配色 |
|---|---|---|---|
| `logo-mark.svg` | 侧边栏 / Tab icon / 头像 | 64x64 | 主色 |
| `logo-mark-inverse.svg` | 浅色背景 / 文字旁 | 64x64 | 主色描边 |
| `logo-horizontal.svg` | 顶部导航 / 登录页 | 232x64 | 主色 + 深灰字 |
| `logo-horizontal-inverse.svg` | 深色背景 | 232x64 | 主色 + 白字 |
| `favicon.svg` | 浏览器 Tab / APP icon | 256x256 | 主色 |

### 2.4 设计变体（未来可拓展）
- **小程序 icon**：导出 `favicon.svg` 为 144x144 / 192x192 PNG
- **横幅 / 海报**：参考 CIP 流程生成宣传图
- **暗色模式**：使用 `logo-horizontal-inverse.svg` 或在主图上去掉底部遮罩

## 3. 配色

| 角色 | 颜色 | 用途 |
|---|---|---|
| **Primary** | `#FF7A45` | 主色（按钮、激活态、Logo 底板） |
| **Primary Light** | `#FF8A5C` | 渐变起点 / hover |
| **Primary Dark** | `#F25C2A` | 渐变终点 / 按下 |
| **Ink** | `#1F2937` | 文字主色 / 浅底 wordmark |
| **Paper** | `#FFFFFF` | 文字反白 / 描边 |

> 完整的色彩 token 见 [docs/superpowers/specs/2026-06-06-design-tokens.md](../../docs/superpowers/specs/2026-06-06-design-tokens.md)

## 4. 字体

### 4.1 品牌字体（wordmark）
- 优先：`PingFang SC` / `Microsoft YaHei` / `Hiragino Sans GB`
- 通用兜底：`Source Han Sans CN` / `sans-serif`
- 字重：500-600
- 字间距：2-4（每 100 字号单位）

### 4.2 系统 UI 字体
- 沿用各端的 design tokens，不在品牌字上做特殊化
- Web 端：Inter / 系统无衬线
- 小程序：苹方 / 思源黑体

## 5. 品牌应用

### 5.1 三端统一原则
- **mark**：所有平台必须使用同一份 `logo-mark.svg`
- **wordmark**：颜色根据背景动态切换（浅底用深字，深底用白字）
- **应用尺寸**：
  - 侧边栏折叠态：32px
  - 侧边栏展开态：mark 32px + 文字 16px
  - 登录页 hero：48-64px
  - Tab icon：24px

### 5.2 平台映射
| 平台 | 文件 | 引用方式 |
|---|---|---|
| frontend-web | `public/logo-*.svg` | Vite 静态资源 / Vue 组件 |
| frontend-admin | `public/logo-*.svg` | Vite 静态资源 / Vue 组件 |
| miniprogram | `assets/brand/logo-mark.svg` | image 标签 / 转换为 PNG 用作 tabBar icon |

## 6. 禁止事项

- ❌ 不要把 `logo-mark.svg` 中的交换循环改成单方向（会丢失"易"的隐喻）
- ❌ 不要把主色 `#FF7A45` 改为更深的红 / 更浅的橙（破坏品牌识别）
- ❌ 不要在 logo 旁加描边 / 阴影 / 渐变文字
- ❌ 不要使用 CMYK 印刷色（仅 Web 端使用 RGB）

## 7. 维护

任何对 logo 的修改必须同步更新：
1. `assets/brand/` 全部 4 个 SVG 文件
2. 各端 `public/` 引用
3. 本 BRAND.md
