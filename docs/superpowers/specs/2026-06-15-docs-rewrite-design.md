# 校园二手交易平台 · docs/ 文档重写设计

> **设计日期**：2026-06-15
> **作者**：Trae IDE
> **Change ID**：`docs-rewrite-cm`
> **状态**：待用户审阅

---

## 一、背景与目标

### 1.1 现状

`docs/` 目录下 14 份企业级设计文档（00 索引 / 00A 规范 / 00B 教学指南 / 01-10 / 14 / 15）当前仍描述"家庭资产管理（Family Finance）"业务，编号体系为 `FF-XXX-001`。但项目已于 2026-06-06 完成业务整体转型为**校园二手交易平台（Campus Market）**，相关业务 Spec、实操文档（README、QUICKSTART、部署、联调、实验）已全部按新业务更新。

### 1.2 目标

按照新的"校园二手交易平台"业务，从头重写 docs/ 下全部 14 份设计类文档，确保：

1. **业务对齐**：所有功能点、字段、接口、流程与 `backend/market/` 实际代码（12 个模型、50+ API 端点）严格一致；
2. **编号统一**：从 `FF-XXX-001`（Family Finance）改为 `CM-XXX-001`（Campus Market）；
3. **角色对齐**：买家 / 卖家 / 平台管理员 三类角色，与 `User.role` 字段一致；
4. **设计 Token 引用**：UI/UX 相关文档统一引用 `docs/superpowers/specs/2026-06-06-design-tokens.md` 中已落地的 token（主色 `#FF6B35`、Lucide SVG、4.5:1 对比度、44pt 触控等）；
5. **可追溯**：通过 14_需求追溯矩阵 串联 FR → 设计 → API → 测试；
6. **三端一致**：同一后端服务的 3 个前端（小程序 + Web 卖家工作台 + Web 平台管理后台）在文档中均有完整映射。

### 1.3 范围与非范围

**包含**：

- docs/ 下 14 份 Markdown 文档整体重写（保留文件名、修改编号与业务内容）
- 09 文档从"语音智能记账"变更为"AI 智能发布与议价模块"（贴合 `market/services/ai_service.py` 的 7 个 AI 端点）

**不包含**：

- `.trae/specs/pivot-to-secondhand-market/` 下的业务 Spec（已就位）
- README.md、QUICKSTART.md、部署说明.md、联调检查清单.md、实验指导书.md（已就位）
- 现有 `superpowers/specs/2026-06-06-design-tokens.md`（已是设计 Token 单一真相源）

---

## 二、文档命名与编号

### 2.1 编号体系

```
CM - {类型缩写} - {序号}

CM     = Campus Market 项目前缀
类型   = IDX | STD | GUIDE | SRS | HLD | LLD | DB | MP | WEB | API-SVC | API | AI | UI | RTM | RUN-MP
序号   = 001
```

### 2.2 文档清单（14 份）

| 序号 | 编号 | 文档名称 | 文件名 | 目标行数 |
|------|------|----------|--------|----------|
| 00 | CM-IDX-001 | 设计文档总索引 | `00_设计文档索引.md` | ~400 |
| 00A | CM-STD-001 | 文档编写与评审规范 | `00A_文档编写与评审规范.md` | ~700 |
| 00B | CM-GUIDE-001 | 企业级软件开发文档体系教学指南 | `00B_企业级软件开发文档体系教学指南.md` | ~700 |
| 01 | CM-SRS-001 | 需求规格说明书 | `01_需求规格说明书_SRS.md` | ~900 |
| 02 | CM-HLD-001 | 概要设计说明书 | `02_概要设计说明书.md` | ~900 |
| 03 | CM-LLD-001 | 详细设计说明书 | `03_详细设计说明书.md` | ~900 |
| 04 | CM-DB-001 | 数据库设计说明书 | `04_数据库设计说明书.md` | ~900 |
| 05 | CM-MP-001 | 微信小程序功能说明书 | `05_微信小程序功能说明书.md` | ~900 |
| 06 | CM-WEB-001 | Web 卖家工作台功能说明书 | `06_Web管理后台功能说明书.md` | ~900 |
| 07 | CM-API-SVC-001 | 后端服务功能说明书 | `07_后端服务功能说明书.md` | ~900 |
| 08 | CM-API-001 | 接口设计说明书 | `08_接口设计说明书.md` | ~1100 |
| 09 | CM-AI-001 | AI 智能发布与议价模块设计 | `09_语音智能记账模块设计说明书.md` | ~800 |
| 10 | CM-UI-001 | UI 与交互设计规范 | `10_UI与交互设计规范.md` | ~900 |
| 14 | CM-RTM-001 | 需求追溯矩阵 | `14_需求追溯矩阵.md` | ~700 |
| 15 | CM-RUN-MP-001 | 微信小程序编译与运行指南 | `15_微信小程序编译与运行指南.md` | ~700 |

> 文件名沿用旧名，仅编号与业务内容变更；如需改文件名（如 09），仅改文档名与编号，不改文件名以保持与现 README 链接一致。

---

## 三、各文档核心章节大纲

### 3.1 00 · 设计文档总索引（CM-IDX-001）

- 文档体系说明（项目概况、对标产品、差异化能力）
- 14 份文档清单与状态
- 三端（小程序 + Web 卖家台 + Web 管理后台）功能文档映射表
- 生命周期与阅读路径（按角色、按阶段）
- 课程教学对照（4 次实训）
- 修订记录

### 3.2 00A · 文档编写与评审规范（CM-STD-001）

- 目的与适用范围
- 编号体系（CM-XXX-001）
- 标准页眉模板
- 必备章节（按文档类型）
- 需求编号规则（FR-C 买家小程序 / FR-S 卖家小程序 / FR-W Web 卖家 / FR-A 管理后台 / NFR / BR / API）
- 评审流程
- 版本与变更管理
- 图表与代码规范
- emoji 禁令（用户规则 5：图标统一 Lucide SVG）
- 关联文档

### 3.3 00B · 企业级软件开发文档体系教学指南（CM-GUIDE-001）

- 企业级文档体系全景
- 14 类文档的价值与时机
- 教学节奏（Day 1-4 与文档章节映射）
- 评审与基线管理
- 与设计 Token 体系的关系
- 文档编写常见问题
- 学生自学路径

### 3.4 01 · 需求规格说明书 SRS（CM-SRS-001）

- 项目背景与目标
- 用户角色与场景（买家 / 卖家 / 平台管理员）
- 业务范围与边界
- **功能需求**（按模块）：
  - FR-AUTH 认证模块（注册 / 登录 / JWT / 校园认证）
  - FR-USER 用户与信用分（学校 / 学号 / 信用分 / 徽章）
  - FR-CAT 分类管理（一级 + 二级、树形）
  - FR-PROD 商品模块（CRUD、状态机、浏览/收藏/搜索）
  - FR-MSG 私聊会话
  - FR-ORD 订单与状态机
  - FR-REV 评价
  - FR-REPORT 举报
  - FR-AI 智能发布 / 议价 / 审核 / 客服（7 个端点）
  - FR-MP 买家小程序（5 tab）
  - FR-WEB 卖家工作台（Vue3 + TS + Element Plus）
  - FR-ADMIN 平台管理后台（Vue3 + JS + Element Plus）
- **非功能需求**（性能 / 安全 / 可用性 / 可维护性 / 兼容性）
- 业务规则（BR-xxx）
- 验收标准
- 风险与缓解

### 3.5 02 · 概要设计说明书 HLD（CM-HLD-001）

- 系统目标与设计原则
- 总体架构（"一后端 + 三前端"、Nginx + Waitress + MySQL + 可选 RabbitMQ）
- 技术栈选型（Python 3.13 / Django 4.2 / DRF / MySQL 9.4 / Vue 3.5 / Element Plus / 小程序原生）
- 模块划分（12 个模型 / 50+ 端点）
- 数据流（注册 → 发布 → 浏览 → 私聊 → 下单 → 完成 → 评价 → 信用分）
- 接口边界（REST 风格、JWT 鉴权、统一响应封装）
- 部署拓扑（本地 / 课堂演示 / 生产 Nginx + Waitress）
- 安全设计总览
- 第三方依赖（LLM / RabbitMQ / 媒体存储）
- 性能与扩展性

### 3.6 03 · 详细设计说明书 LLD（CM-LLD-001）

- 模块详细逻辑
- 关键算法与流程
  - 商品状态机：`draft → pending → on_sale → pending_sold → sold / off_shelf`
  - 订单状态机：`requested → confirmed → shipping → completed / cancelled`
  - 信用分变更算法（注册 80 / 好评 +1 / 差评 -1 / <60 触发审核）
  - AI 一键发布流程（图片上传 → LLM 多模态 → 解析 JSON → 表单预填）
  - 会话未读数维护
  - 瀑布流分页算法
- 类图 / 时序图（Mermaid）
- 异常处理矩阵
- 配置项清单（`.env`）
- 缓存策略
- 并发与幂等性

### 3.7 04 · 数据库设计说明书（CM-DB-001）

- 设计原则（12 个模型、自定义表名、复合索引）
- ER 图（Mermaid）
- 数据字典（12 张表字段级说明）
  - `market_user` / `market_category` / `market_product` / `market_product_image`
  - `market_favorite` / `market_conversation` / `market_message`
  - `market_order` / `market_review` / `market_report`
  - `market_audit_log` / `market_system_setting`
- DDL 全文（基于 `migrations/0001_initial.py`）
- 索引策略（覆盖索引、复合索引、排序索引）
- 数据迁移与初始化（`init_data_market.py` 流程）
- 数据备份与恢复
- 字符集与排序规则（utf8mb4 / utf8mb4_unicode_ci）
- 性能与容量预估

### 3.8 05 · 微信小程序功能说明书（CM-MP-001）

- 概述（5 tab 自定义导航、端到端定位）
- 全局约定（API 基址、Token 存储、统一 Toast）
- 页面清单（11 个）：
  - `pages/index` 首页（双列瀑布流）
  - `pages/category` 分类（一级宫格 + 二级列表）
  - `pages/publish` 发布（含 AI 一键发布）
  - `pages/message` 消息（会话列表）
  - `pages/mine` 我的（信用分徽章 / 我的发布 / 我买到的 / 我的收藏）
  - `pages/detail` 商品详情（9 图轮播 + 卖家卡 + 双 CTA）
  - `pages/chat` 私聊（文字/图片）
  - `pages/orders` 订单（Tab 切换 + 状态机）
  - `pages/login` 登录
  - `pages/search` 搜索结果
  - `pages/report` 举报
- 组件清单（`product-card` / `credit-badge` / `voice-input` / `ai-loading` / `empty-state`）
- 字段级说明、交互、空状态
- 接口映射（每页 → 1~N 个 API）
- 设计 Token 引用（来自 design-tokens.md）

### 3.9 06 · Web 卖家工作台功能说明书（CM-WEB-001）

> 注：文件名仍为 `06_Web管理后台功能说明书.md`（保持与现 README 链接一致），实际内容是"Web 卖家工作台（端口 3000）"。

- 概述（Vue3 + TypeScript + Element Plus + ECharts + Pinia + Axios）
- 路由与布局（顶栏 + 侧边栏，顶栏含信用分）
- 页面清单：
  - `Login` 登录
  - `Dashboard` 仪表盘（4 张指标卡 + ECharts 销售趋势）
  - `MyProducts` 我的商品（表格 + 筛选 + 批量）
  - `CreateProduct` 创建商品（AI 一键发布入口）
  - `Orders` 订单管理（状态机步骤条）
  - `Messages` 消息中心
  - `Statistics` 数据统计（类目分布 / 价格区间）
  - `Profile` 资料设置
- 字段、交互、接口映射
- 响应式断点（768 / 1024 / 1440）
- 设计 Token 引用

### 3.10 07 · 后端服务功能说明书（CM-API-SVC-001）

- 概述（Django 4.2 + DRF + SimpleJWT + 自定义 User）
- App 结构（`config/` / `market/` 12 个模型 / 11 个 views 子模块 / 7 个 serializers / 4 个 services）
- 业务模块
  - 认证（JWT 颁发 / 刷新 / 校园认证）
  - 用户（CRUD / 信用分 / 头像 / 改密）
  - 分类（树形 / 拖拽排序）
  - 商品（CRUD / 状态机 / 收藏 / 上下架 / 详情 / 浏览数 +1）
  - 私聊（会话 / 消息 / 未读数 / 默认招呼语）
  - 订单（状态机 / 评价 / 信用分联动）
  - 举报（处理 / 审计）
  - AI（7 个端点 / LLM 接入 / 降级）
  - 管理后台（仪表盘 / 用户 / 审核 / 举报 / 分类 / 日志 / AI 配置）
  - 统计（卖家总览 / 趋势 / 分布）
  - 系统（轮播 / 公告 / 热词 / 站点统计 / 首页 feed）
- 通用机制（分页 / 响应封装 / 异常 / 权限 / 限流）
- 性能与并发
- 部署与运行（waitress-serve / gunicorn）

### 3.11 08 · 接口设计说明书（CM-API-001）

- 通用约定（基址、版本、Header、JWT、错误码、分页、排序）
- 鉴权约定（access + refresh、过期时间）
- 错误码字典（400xx 业务、401xx 鉴权、403xx 权限、404xx 资源、5xx 系统）
- **API 全量清单**（按 11 个模块分组，> 50 端点）
  - 健康检查
  - 认证（注册 / 登录 / 登出 / 刷新 / 校园认证）
  - 用户（me / stats / avatar / verify / change-password / public）
  - 分类（列表 / 树）
  - 商品（列表 / 创建 / 详情 / 编辑 / 删除 / 上下架 / 收藏 / 上传图 / 推荐 / 同款 / 评价）
  - 收藏（列表 / 切换 / 兼容旧）
  - 会话（列表 / 详情 / 创建 / 读 / 消息）
  - 订单（CRUD / 确认 / 拒绝 / 取消 / 完成 / 发货 / 评价）
  - 举报（提交 / 列表 / 数量 / 处理）
  - 管理后台（仪表盘 / 趋势 / 类目分布 / 用户 / 商品审核 / 分类 / 举报处理 / 审计日志 / AI 配置）
  - AI（publish-assist / price-suggest / moderate / polish / negotiate / extract-keywords / customer-service / chat / health）
  - 卖家统计（总览 / 趋势 / 类目 / 价格）
  - 上传 / 系统（轮播 / 公告 / 热词 / 统计 / 首页 feed）
- 兼容性策略（`compat_views.py` 提供的旧路径）
- 幂等性 / 速率限制
- 鉴权矩阵
- 版本变更记录

### 3.12 09 · AI 智能发布与议价模块设计（CM-AI-001）

> **变更说明**：原 09 是"语音智能记账模块"，现变更为"AI 智能发布与议价模块"，贴合 `market/services/ai_service.py` 的 7 个 AI 端点。

- 模块定位（核心亮点 / 答辩加分项）
- 设计目标与边界
- 整体架构
  - LLM 客户端（OpenAI 兼容协议、多模态、限流、重试）
  - 提示词管理（`ai_prompts.py`）
  - 服务层（`ai_service.py` 7 个方法）
  - 降级策略（无 Key / 调用失败 → mock）
  - ASR 适配器（语音转文字，可选）
- 7 个 AI 端点详细设计
  - `POST /api/ai/publish-assist/` — 一键发布
  - `GET /api/ai/price-suggest/` — 议价参考价
  - `POST /api/ai/moderate/` — 内容审核
  - `POST /api/ai/polish/` — 文案润色
  - `POST /api/ai/negotiate/` — 议价话术
  - `POST /api/ai/extract-keywords/` — 关键词提取
  - `POST /api/ai/customer-service/` — 智能客服
  - `POST /api/ai/chat/` — 通用对话
- Prompt 模板（每个端点列出示例 prompt）
- 降级与回退（mock 数据格式）
- 监控与统计（管理后台 AI 配置页）
- 配置项（`.env` 中 LLM_* 与 AI_*_ENABLED）
- 安全（防止 prompt 注入 / 内容审核边界）

### 3.13 10 · UI 与交互设计规范（CM-UI-001）

> 内容主参考 `superpowers/specs/2026-06-06-design-tokens.md`，本文档侧重"规范说明 + 在三端的落地"。

- 设计目标与对标（闲鱼 / 得物 / 小红书 / 微信原生）
- 设计原则（6 项）
- 视觉设计
  - 品牌色 / 文本色 / 背景色 / 状态色 / 信用分等级色
  - 字体（双端字体族、字号、字重、行高）
  - 间距 / 圆角 / 阴影
- 布局系统
  - 容器 / 触控热区（44pt）/ 响应式断点 / z-index
- 动效系统（150/200/300/500ms + ease-out/in/out）
- 图标规范（Lucide SVG、严禁 emoji）
- 组件规范（按钮 / 卡片 / 输入框 / 标签 / 信用分徽章 / 商品状态 / 订单状态 / 瀑布流）
- 可访问性（4.5:1 对比 / focus 环 / ARIA / reduced-motion）
- 三端落地（小程序 / Web 卖家台 / Web 管理后台）
- 设计走查 checklist

### 3.14 14 · 需求追溯矩阵（CM-RTM-001）

- 需求编号（与 01 SRS 对齐）
- 追溯维度：需求 → 设计章节 → 接口 → 三端落地 → 测试点
- 矩阵表格（按 FR-AUTH / FR-USER / FR-CAT / FR-PROD / FR-MSG / FR-ORD / FR-REV / FR-REPORT / FR-AI 分组）
- 状态标记（已实现 / 部分实现 / 待扩展）
- 变更追踪
- 维护策略

### 3.15 15 · 微信小程序编译与运行指南（CM-RUN-MP-001）

- 环境前置（微信开发者工具 / AppID / 网络）
- 项目结构（11 个页面 / 3+ 组件 / utils / 自定义 tab-bar）
- 编译运行步骤
- API 基址配置（模拟器 vs 真机）
- "不校验合法域名" 配置
- 自定义 tab-bar 实现说明
- 调试技巧
- 真机调试 + 内网穿透
- 性能优化
- 发布上线（小程序公众平台提交审核）
- 常见错误

---

## 四、编写规范约束

1. **emoji 禁令**（用户规则 5）：所有 UI 图标用 Lucide SVG，文档中的 emoji 也需用文字替代（如用"+"代替 ➕）；
2. **中文为主**（用户规则 1）：用户可见文字中文，技术标识可英文；
3. **Windows PowerShell 兼容**（用户规则 6）：命令示例用 PowerShell 语法（不用 `&&`）；
4. **设计 Token 引用**（用户规则 5 + 设计 token 文档）：所有 UI 颜色 / 字号 / 间距引用 token，禁止硬编码 hex；
5. **代码示例带注释**（用户规则 3）：每个 Python / JavaScript 函数级注释；
6. **路径全部基于 `d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\`**，避免出现"家庭记账"等旧业务词汇；
7. **行数目标**：每份 700+ 行（依用户决策"完整版"）；
8. **链接全部用 file:// 协议**（代码引用规范），保持 markdown 链接可点击；
9. **图表优先 Mermaid**（流程图 / 时序图 / ER 图），复杂时附 ASCII；
10. **每份文档必须包含**：标准页眉、目录、修订记录、关联文档链。

---

## 五、实施步骤

按 brainstorming skill 流程：

1. ✅ **Step 1-2**：本设计 doc（已就位）
2. ⏳ **Step 3**：用户审阅本文档大纲
3. ⏳ **Step 4**：调用 `writing-plans` skill，编写批量重写实施计划
4. ⏳ **Step 5-18**：按 14 份文档逐一重写（每份独立可验证）
5. ⏳ **Step 19**：交叉引用校验、版本号统一、链接有效性确认

---

## 六、关联文档

- 业务 Spec：[.trae/specs/pivot-to-secondhand-market/spec.md](../pivot-to-secondhand-market/spec.md)
- 任务清单：[.trae/specs/pivot-to-secondhand-market/tasks.md](../pivot-to-secondhand-market/tasks.md)
- 验收报告：[docs/WAVE4_ACCEPTANCE_REPORT.md](../WAVE4_ACCEPTANCE_REPORT.md)
- 设计 Token：[docs/superpowers/specs/2026-06-06-design-tokens.md](../superpowers/specs/2026-06-06-design-tokens.md)
- 实操文档（已就位，不动）：[docs/QUICKSTART.md](../QUICKSTART.md) / [docs/部署说明.md](../部署说明.md) / [docs/联调检查清单.md](../联调检查清单.md) / [docs/实验指导书.md](../实验指导书.md)
- 现有 emoji 审查报告：[docs/EMOJI_AUDIT.md](../EMOJI_AUDIT.md)

---

## 七、风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 14 份文档体量过大，单次写完质量下降 | 中 | 分阶段实施，每份独立评审，优先 01 SRS / 04 DB / 08 API 三份核心 |
| 文档与代码脱节（接口路径错误） | 高 | 08 API 文档必须对照 `backend/market/urls.py` 与每个 views 实际代码逐项核对 |
| 编号体系全改，旧引用 404 | 中 | 保留旧文件名，仅文档内编号改 CM-*；索引中给出旧 FF-* → CM-* 对照 |
| 文档 700+ 行可能含 emoji 残留 | 中 | 写完每份后用 [docs/EMOJI_AUDIT.md](../EMOJI_AUDIT.md) 的扫描规范自检 |
| 旧"家庭记账"内容残留 | 高 | 每份文档写完前 grep 关键字（家庭 / 账本 / 记账 / 流水 / 预算 / FF-* 等）确认无残留 |
| 跨文档链接断裂 | 中 | 实施完毕后用 Markdown 链接校验脚本（如 `markdown-link-check`）跑一遍 |

---

**设计就绪，等待用户审阅。**
