# 校园二手交易平台 — 快速开始

> **5 分钟启动** 一后端 + 三前端（小程序 + Web 卖家工作台 + Web 平台管理后台）
> **版本**：v2.0（2026-06-06）
> **环境**：Windows 11 64-bit / Python 3.13 / MySQL 9.4 / Node.js LTS
> **配套文档**：[README.md](../README.md) / [部署说明.md](部署说明.md) / [联调检查清单.md](联调检查清单.md) / [实验指导书.md](实验指导书.md)

---

## 一、环境前置

| 工具 | 路径 / 版本 | 检查命令 |
|------|-------------|----------|
| Python | `C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe` | `python --version` |
| MySQL  | `C:\Program Files\MySQL\MySQL Server 9.4\bin\`（root / tyb1124） | `mysql --version` |
| Node.js | LTS 18+ | `node --version` |
| 微信开发者工具 | 最新版 | — |
| RabbitMQ（可选） | `D:\RJ\RabbitMQ` | `rabbitmqctl status` |

---

## 二、一键启动（最快路径，3 条命令）

打开 PowerShell，进入项目根目录：

```powershell
# 1. 首次：初始化数据库（建库 + 迁移 + 种子数据）
.\deploy\setup_database.ps1

# 2. 启动所有服务（后端 + 卖家工作台 + 管理后台）
.\deploy\start_all.ps1

# 3. 完成后停止
.\deploy\stop_all.ps1
```

启动成功后访问：

| 端 | 地址 | 用途 |
|----|------|------|
| 后端 API | http://127.0.0.1:8000/ | Django |
| 健康检查 | http://127.0.0.1:8000/api/health/ | 返回 `{"code":0,...}` 即正常 |
| 卖家工作台 | http://127.0.0.1:3000/ | Vue3 + TS + Element Plus |
| 平台管理后台 | http://127.0.0.1:5173/ | Vue3 + JS + Element Plus |
| 微信小程序 | 微信开发者工具内 | 原生 + 自定义 tab-bar |

---

## 三、分步启动（首次或排查问题时使用）

### 步骤 1 — 建库（首次必做）

```powershell
# 库名 campus_market，字符集 utf8mb4
& "C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -ptyb1124 `
  < ".\backend\scripts\create_mysql_db.sql"
```

### 步骤 2 — 安装后端依赖

```powershell
cd backend
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements.txt
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements-voice.txt
```

### 步骤 3 — 迁移与种子数据

```powershell
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py makemigrations market
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py migrate
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe scripts\init_data_market.py
```

### 步骤 4 — 启动各服务（每个命令打开一个新 PowerShell 窗口）

```powershell
# 终端 A：后端（waitress-serve，端口 8000）
.\deploy\start_backend.ps1

# 终端 B：卖家工作台（Vite，端口 3000）
.\deploy\start_frontend_web.ps1

# 终端 C：平台管理后台（Vite，端口 5173）
.\deploy\start_frontend_admin.ps1
```

### 步骤 5 — 微信小程序

1. 打开微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录
2. `app.js` 中 `apiBase` 指向 `http://127.0.0.1:8000`（模拟器）或电脑局域网 IP（真机）
3. 详情 → 勾选「不校验合法域名」

---

## 四、deploy/ 目录脚本清单

| 脚本 | 作用 | 端口 |
|------|------|------|
| `deploy\setup_database.ps1` | 建库 + 安装 Python 依赖 + 迁移 + 种子数据 | — |
| `deploy\start_backend.ps1` | 启动后端（waitress-serve） | 8000 |
| `deploy\start_frontend_web.ps1` | 启动卖家工作台（Vite） | 3000 |
| `deploy\start_frontend_admin.ps1` | 启动管理后台（Vite） | 5173 |
| `deploy\start_all.ps1` | 一键启动全部服务 | 8000 + 3000 + 5173 |
| `deploy\stop_all.ps1` | 一键停止全部服务 | — |

> **说明**：与 `scripts\*.bat` 脚本并存。`.bat` 用 `runserver`，`.ps1` 用 `waitress-serve`（生产级 WSGI）。课堂演示可用任一套。

---

## 五、默认账号

| 角色 | 账号 | 密码 | 使用端 |
|------|------|------|--------|
| 管理员 | `admin` | `admin123` | Web 管理后台（5173） |
| 卖家 | `zhangsan` | `123456` | 小程序 / Web 卖家台（3000） |
| 卖家 | `lisi` | `123456` | 小程序 / Web 卖家台（3000） |
| 买家 | `wangwu` | `123456` | 小程序 |

---

## 六、5 分钟验收清单

完成上述一键启动后，按顺序验证：

- [ ] **后端健康检查**：浏览器访问 `http://127.0.0.1:8000/api/health/`，返回 `code: 0`
- [ ] **卖家工作台**：浏览器访问 `http://127.0.0.1:3000/`，登录 `zhangsan / 123456`，看到 Dashboard
- [ ] **管理后台**：浏览器访问 `http://127.0.0.1:5173/`，登录 `admin / admin123`，看到仪表盘
- [ ] **微信小程序**：导入 `miniprogram/`，登录 `wangwu / 123456`，首页瀑布流出现 20+ 商品
- [ ] **AI 一键发布**：在卖家工作台「创建商品」上传图片，AI 自动识别类目/标题/描述/建议价
- [ ] **三端一致**：买家在小程序下单 → 卖家在 Web 卖家台确认 → 管理员在 Web 后台审核 → 全链路状态机推进

---

## 七、常见问题

| 问题 | 解决方案 |
|------|----------|
| `Access denied for user 'root'` | 检查 `backend\.env` 中 `DB_USER` / `DB_PASSWORD` 是否为 `root` / `tyb1124` |
| `Unknown database 'campus_market'` | 先执行 `deploy\setup_database.ps1` 或手动建库 SQL |
| `No module named 'waitress'` | `pip install waitress`（start_backend.ps1 会自动安装） |
| `No module named 'pymysql'` | `pip install -r backend\requirements.txt` |
| 端口 8000/3000/5173 被占用 | `.\deploy\stop_all.ps1` 关闭旧进程 |
| 前端依赖未安装 | `cd frontend-web` 或 `cd frontend-admin` 后执行 `npm install` |
| 微信小程序请求失败 | 微信开发者工具 → 详情 → 勾选「不校验合法域名」 |
| AI 一键发布返回 mock | 编辑 `backend\.env`，配置 `LLM_API_KEY` / `LLM_BASE_URL` |
| RabbitMQ 启动失败（可选） | 检查 `D:\RJ\RabbitMQ` 是否安装；`RABBITMQ_ENABLED=False` 可禁用 |

---

## 八、目录速查

```
综合实训/
├── backend/                # Django 后端
├── frontend-web/           # 卖家工作台（端口 3000）
├── frontend-admin/         # 管理后台（端口 5173）
├── miniprogram/            # 微信小程序
├── deploy/                 # 【本指南】PowerShell 一键脚本
│   ├── setup_database.ps1
│   ├── start_backend.ps1
│   ├── start_frontend_web.ps1
│   ├── start_frontend_admin.ps1
│   ├── start_all.ps1
│   └── stop_all.ps1
├── scripts/                # .bat 一键脚本（保留兼容）
├── docs/
│   ├── QUICKSTART.md       # 本文件
│   ├── 部署说明.md
│   ├── 联调检查清单.md
│   └── 实验指导书.md
└── README.md
```

---

## 九、下一步

- 联调演示脚本（5 分钟答辩流程）见 [联调检查清单.md](联调检查清单.md) 第七节
- 生产环境部署（Nginx + Waitress + RabbitMQ）见 [部署说明.md](部署说明.md)
- 设计 Token 规范见 [superpowers/specs/2026-06-06-design-tokens.md](superpowers/specs/2026-06-06-design-tokens.md)
- 后端详细说明见 [../backend/README.md](../backend/README.md)
- 业务转型 Spec 见 [../.trae/specs/pivot-to-secondhand-market/spec.md](../.trae/specs/pivot-to-secondhand-market/spec.md)
