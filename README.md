# 校园二手交易平台 — 综合实训项目

本项目基于 Django + DRF + MySQL + Vue3 + 微信小程序 构建的 **C2C 校园二手交易平台**，整合了课程 4 次实训的全部内容（Day01 ~ Day04），支持 **一后端 + 三前端**（小程序 + Web 卖家工作台 + Web 平台管理后台）的端到端联调。

项目在保留原"家庭记账"技术栈与基础设施的前提下，**业务整体转型**为校园二手交易领域，并按 `ui-ux-pro-max` 标准做了大刀阔斧的视觉与体验升级。

---

## 一、项目结构

```
综合实训/
├── backend/                # Django 后端（端口 8000）
│   ├── config/             # Django 项目配置（settings / urls / wsgi）
│   ├── market/             # 业务 App：用户 / 商品 / 订单 / 私聊 / 评价 / 信用分 / AI
│   │   ├── models.py       # User / Product / Category / Order / Review / ...
│   │   ├── views/          # auth / product / order / message / ai / admin ...
│   │   ├── serializers/    # DRF 序列化器
│   │   ├── services/       # ai_service / llm_client / asr_adapter
│   │   └── migrations/     # 0001_initial ...
│   ├── finance_legacy/     # 【已下线】原"家庭记账"业务代码，备份保留供参考
│   ├── scripts/            # 初始化脚本（建库 SQL、种子数据、关键词）
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env / .env.example
│   └── 安装运行流程.txt
│
├── frontend-web/           # 完整版 Web 前端 — 卖家工作台（端口 3000，Vue3 + TS + Element Plus）
│   └── src/{api,views,router,stores,utils,layouts,style}
│
├── frontend-admin/         # 教学版 Web 前端 — 平台管理后台（端口 5173，Vue3 + JS + Element Plus）
│   └── src/{api,views,router,stores,layouts,style}
│
├── miniprogram/            # 微信小程序（原生 + 自定义 tab-bar）
│   ├── pages/              # home / category / publish / message / mine / detail / chat / orders / login
│   ├── components/         # product-card / voice-input / credit-badge ...
│   ├── custom-tab-bar/     # 5 tab 自定义导航：首页 / 分类 / 发布 / 消息 / 我的
│   ├── utils/{api,request,voice}
│   └── app.js / app.json / app.wxss
│
├── scripts/                # 一键启动脚本（Windows .bat，runserver 方式）
│   ├── start-backend.bat
│   ├── start-frontend-web.bat
│   ├── start-frontend-admin.bat
│   ├── start-all.bat       # 一键启动全部
│   ├── stop-all.bat        # 一键停止全部
│   └── install-deps.bat    # 一键安装依赖
│
├── deploy/                 # 【推荐】PowerShell 一键脚本（waitress-serve 方式）
│   ├── setup_database.ps1  # 建库 + 迁移 + 种子数据
│   ├── start_backend.ps1   # 启动后端（waitress）
│   ├── start_frontend_web.ps1    # 启动卖家工作台
│   ├── start_frontend_admin.ps1  # 启动管理后台
│   ├── start_all.ps1       # 一键启动全部
│   └── stop_all.ps1        # 一键停止全部
│
├── docs/                   # 项目文档
│   ├── QUICKSTART.md       # 5 分钟快速开始
│   ├── 联调检查清单.md
│   ├── 部署说明.md
│   ├── 实验指导书.md
│   └── superpowers/specs/2026-06-06-design-tokens.md   # 设计 Token 规范
│
├── .trae/specs/pivot-to-secondhand-market/   # 业务转型 Spec 与任务清单
│
└── README.md               # 本文件
```

> **关于 `finance_legacy/`**：原"家庭记账"业务代码已下线，作为历史备份保留，**不参与运行**。当前业务全部在 `market/` 中。

---

## 二、技术栈

| 端 | 技术 |
|----|------|
| 后端 | Python 3.13 + Django 5 + DRF + SimpleJWT + MySQL 9.4 + PyMySQL + Pillow |
| Web 前端（卖家工作台） | Vue3 + TypeScript + Vite + Element Plus + ECharts + Pinia + Axios |
| Web 前端（管理后台） | Vue3 + JavaScript + Vite + Element Plus + Vue Router + Pinia |
| 微信小程序 | 原生小程序 + 自定义 tab-bar + wx.request + wx.uploadFile |
| 消息队列（可选） | RabbitMQ（本地路径 `D:\RJ\RabbitMQ`，用于订单异步通知 / AI 任务队列） |
| AI | LLM 接入（OpenAI 兼容协议），无 Key 时降级为 mock 并显式标注 |

---

## 三、环境准备

### 1. Python
- 路径：`C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe`
- 版本：Python 3.13

### 2. MySQL
- 路径：`C:\Program Files\MySQL\MySQL Server 9.4\bin\`
- 账号：`root` / `tyb1124`
- 库名：`campus_market`（首次启动需先建库）

### 3. Node.js
- 任意 LTS 版本（推荐 18+）
- 包管理器：npm

### 4. 微信开发者工具
- 用于导入 `miniprogram/` 调试小程序
- 真机调试需勾选「不校验合法域名」

### 5. RabbitMQ（可选）
- 本地路径：`D:\RJ\RabbitMQ`
- 用于订单状态变更的异步通知、AI 任务队列等

---

## 四、启动步骤（推荐顺序）

### 方式 A：一键启动（推荐，PowerShell + waitress）

```powershell
# 1. 首次：初始化数据库（建库 + 依赖 + 迁移 + 种子数据）
.\deploy\setup_database.ps1

# 2. 启动后端 + 两个 Web 端（生产级 waitress-serve）
.\deploy\start_all.ps1

# 3. 完成后停止全部
.\deploy\stop_all.ps1
```

### 方式 B：一键启动（.bat + runserver，兼容旧版）

```bat
:: 1. 一键安装全部依赖（首次）
scripts\install-deps.bat

:: 2. 一键启动后端 + 两个前端
scripts\start-all.bat

:: 3. 完成后用 stop-all 关闭
scripts\stop-all.bat
```

### 方式 C：分步启动

```bat
:: 第 1 步：建库（首次必须）
"C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -ptyb1124 < backend\scripts\create_mysql_db.sql

:: 第 2 步：初始化数据（首次必须）
cd backend
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py makemigrations market
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py migrate
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe scripts\init_data_market.py

:: 第 3 步：启动后端
scripts\start-backend.bat

:: 第 4 步：启动 Web 卖家工作台（开新终端）
scripts\start-frontend-web.bat

:: 第 5 步：启动 Web 管理后台（开新终端）
scripts\start-frontend-admin.bat

:: 第 6 步：导入微信小程序
:: 微信开发者工具 → 导入项目 → 选择 miniprogram\ 目录
```

---

## 五、访问地址

| 端 | 地址 | 说明 |
|----|------|------|
| 后端 API | http://127.0.0.1:8000/ | Django |
| 健康检查 | http://127.0.0.1:8000/api/health/ | 返回 `{"code":0,...}` 即正常 |
| Web 卖家工作台 | http://127.0.0.1:3000/ | 卖家管理商品 / 订单 / 看板 |
| Web 管理后台 | http://127.0.0.1:5173/ | 平台审核 / 举报 / 统计 |
| 微信小程序 | 微信开发者工具内 | 5 tab：首页 / 分类 / 发布 / 消息 / 我的 |

---

## 六、默认账号

| 角色 | 账号 | 密码 | 使用端 | 说明 |
|------|------|------|--------|------|
| 管理员 | `admin` | `admin123` | Web 管理后台（5173） | 平台审核、用户管理、统计 |
| 卖家 | `zhangsan` | `123456` | 微信小程序 / Web 卖家台（3000） | 拥有示例商品 |
| 卖家 | `lisi` | `123456` | 微信小程序 / Web 卖家台（3000） | 拥有示例商品 |
| 买家 | `wangwu` | `123456` | 微信小程序 | 演示下单与评价 |

> 若登录提示「用户名或密码错误」，先到后端把账号激活并重置密码：
> ```bat
> cd backend
> C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py shell
> ```
> ```python
> from django.contrib.auth import get_user_model
> u = get_user_model().objects.get(username='zhangsan')
> u.is_active = True
> u.set_password('123456')
> u.save()
> ```

---

## 七、核心功能

### 7.1 用户与认证
- **校园身份注册**：用户名 / 密码 / 学校 / 学号（选填）
- **JWT 鉴权**：Access Token + Refresh Token，自动续签
- **角色体系**：`user`（学生卖家 / 买家）/ `admin`（平台管理员）
- **个人资料**：头像 / 学校 / 昵称 / 学号 / 信用分

### 7.2 商品管理
- **发布商品**：标题 / 描述 / 价格 / 成色 / 分类 / 多图（最多 9 张）
- **AI 一键发布**：拍照 / 选图 → 自动识别物品类目 + 润色描述 + 建议价格
- **浏览与搜索**：首页双列瀑布流、按分类筛选、关键词模糊查询
- **商品状态机**：`on_sale`（在售） / `pending`（已被下单） / `sold`（已售） / `offline`（下架）

### 7.3 私聊与议价
- **会话列表**：按最近消息倒序
- **消息发送**：文字 + 图片
- **默认招呼语**：进入会话自动发送"你好，我对这件商品感兴趣"

### 7.4 订单与状态机
- **状态流转**：`requested`（买家提交） → `confirmed`（卖家确认） → `completed`（双方确认完成） / `cancelled`（取消）
- **自取 / 快递**：卖家确认时选择交付方式
- **订单可视化**：步骤条 + 状态徽章

### 7.5 评价与信用分
- **双向评价**：订单完成后买卖双方各评 1-5 星 + 留言
- **信用分规则**：初始 80，好评 +1，差评 -1，最低 0、最高 100
- **徽章展示**：信用分以彩色徽章 + 数字滚动动效呈现
- **低信用约束**：信用分 < 60 时，发布商品自动进入待审核

### 7.6 数据统计
- **卖家看板**：在售数 / 已售数 / 收藏数 / 销售趋势（ECharts）
- **平台看板**：用户数 / 商品数 / 订单数 / 今日新增 / 待审核数
- **类目分布、价格区间分布**：饼图 + 柱状图

### 7.7 管理后台
- **用户管理**：列表 / 搜索 / 封禁 / 信用分调整
- **商品审核**：待审核列表 / 批量通过 / 驳回（带理由模板）
- **分类管理**：一级 + 二级树形 CRUD
- **举报处理**：警告 / 下架 / 封禁
- **审计日志**：所有管理员操作留痕
- **AI 配置**：LLM Key 接入测试、Mock 开关

### 7.8 AI 能力
- **AI 一键发布**：图片识物 + 描述润色 + 建议价 + 置信度
- **AI 议价参考**：聊天中提示"参考同款历史成交价"
- **AI 内容审核**：发布文本 / 图片描述敏感词检测
- **降级策略**：无 Key 或 LLM 失败时返回 mock，前端以"AI 推荐"灰色标识区分

---

## 八、项目亮点（答辩加分）

1. **AI 一键发布** — 拍照即可生成商品标题 / 描述 / 类目 / 建议价，是闲鱼 / 得物级别的"懒人发布"体验，是核心差异化亮点。
2. **信用分系统** — 借鉴支付宝芝麻信用，订单完成后动态调整 + 徽章可视化 + 数字滚动动效，答辩可讲故事。
3. **设计 Token 体系** — 颜色 / 字号 / 间距 / 动效全部 CSS 变量化，三端（小程序 + 两套 Web）统一引用，无硬编码 hex，**无 emoji 图标**（统一 Lucide 风格 SVG）。
4. **三端联调** — 同一后端 API 服务「小程序 + Web 卖家台 + Web 平台后台」，覆盖买家、卖家、管理员三类角色，联调清单与 5 分钟演示脚本齐全。
5. **订单状态机** — `requested → confirmed → completed / cancelled`，状态流转 + 步骤条可视化 + 通知机制，逻辑清晰可演示。
6. **可访问性** — 44pt 触控热区、4.5:1 对比度、focus 环、`prefers-reduced-motion` 适配、aria-label 完整。

---

## 九、常见问题

| 问题 | 解决方案 |
|------|----------|
| `Access denied for user 'root'` | 检查 `backend\.env` 中 `DB_USER` / `DB_PASSWORD` 是否为 `root` / `tyb1124` |
| `Unknown database 'campus_market'` | 先执行 `backend\scripts\create_mysql_db.sql` 建库 |
| `Can't connect to MySQL server` | 确认 MySQL 服务已启动、端口 3306 未被占用 |
| `No module named 'pymysql'` | 执行 `pip install -r backend\requirements.txt` |
| 前端 5173 / 3000 端口连不上 | 检查 `frontend-*\vite.config.{js,ts}` 端口配置，或被占用 |
| 小程序请求失败 | 微信开发者工具 → 详情 → 「不校验合法域名」勾选；`app.js` 的 `apiBase` 指向电脑局域网 IP |
| 跨域 CORS 报错 | 后端已默认开启 `corsheaders`，无需额外配置 |
| AI 一键发布返回 mock | 检查 `backend\.env` 中 `LLM_API_KEY` / `LLM_BASE_URL` 是否配置 |
| 商品图片显示 404 | 确认 `MEDIA_ROOT` 与 Nginx `location /media/` 路径一致 |

---

## 十、后续开发建议

1. **接入 RabbitMQ**（`D:\RJ\RabbitMQ`）：用于订单状态变更异步通知、AI 任务队列、消息推送
2. **配置 LLM Key**：在 `backend\.env` 设置 `LLM_API_KEY` / `LLM_BASE_URL` 启用真实 AI 能力
3. **生产部署**：参考 `docs\部署说明.md`，可使用 Nginx + Gunicorn（Linux）/ Waitress（Windows）+ MySQL
4. **WebSocket 私聊**：将当前消息轮询升级为 WebSocket 实时推送
5. **小程序发布**：`project.config.json` 中配置正式 AppID，提交微信审核
6. **支付集成**：可接入微信支付完成"快递"场景下的担保交易

---

## 十一、参考文档

- [`docs/QUICKSTART.md`](docs/QUICKSTART.md) — 5 分钟快速开始（PowerShell 一键部署）
- [`docs/联调检查清单.md`](docs/联调检查清单.md) — 三端联调步骤、API 清单、5 分钟答辩演示脚本
- [`docs/部署说明.md`](docs/部署说明.md) — 生产环境部署指南（Nginx + Waitress + RabbitMQ）
- [`docs/实验指导书.md`](docs/实验指导书.md) — 课程 4 次实验指导书
- [`docs/superpowers/specs/2026-06-06-design-tokens.md`](docs/superpowers/specs/2026-06-06-design-tokens.md) — 设计 Token 规范
- [`backend/README.md`](backend/README.md) — 后端详细说明
- [`backend/安装运行流程.txt`](backend/安装运行流程.txt) — 手动启动命令
- [`deploy/`](deploy/) — PowerShell 一键部署脚本（setup_database / start_all / stop_all）
- [`scripts/`](scripts/) — .bat 一键启动脚本（兼容旧版，runserver 方式）
- [`.trae/specs/pivot-to-secondhand-market/spec.md`](.trae/specs/pivot-to-secondhand-market/spec.md) — 业务转型 Spec
- [`.trae/specs/pivot-to-secondhand-market/tasks.md`](.trae/specs/pivot-to-secondhand-market/tasks.md) — 任务清单

---

**版本**：v2.0（业务转型版）
**最后更新**：2026-06-06
**环境**：Windows 11 64-bit / Python 3.13 / MySQL 9.4 / Node.js LTS
