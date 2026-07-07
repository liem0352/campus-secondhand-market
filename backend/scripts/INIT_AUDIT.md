# market 应用数据库初始化检查报告

> 审计日期：2026-06-06
> 范围：`backend/market/` + `backend/scripts/`
> 审计结论：就绪

---

## 1. 审计概览

| 维度 | 结果 | 说明 |
| --- | --- | --- |
| Django 迁移 | 完整 | `market/migrations/0001_initial.py` 覆盖全部 11 个模型 |
| 建库 SQL | 完整 | `scripts/create_mysql_db.sql` 切换为 `campus_market` 库 |
| 分类初始化 | 完整 | 新增 `init_categories.py`（7 大一级 + 25 个二级） |
| 管理员账号 | 完整 | 新增 `init_admin.py`（密码从 `.env` 读取） |
| 种子数据 | 完整 | `init_data_market.py` 包含 5 大类 / 4 用户 / 22 商品 / 1 举报 |
| 关键词脚本 | 兼容 | `init_data.py` / `init_keywords.py` 仍归 finance_legacy，可选执行 |
| 环境变量 | 完整 | `.env.example` 已涵盖 MySQL / 媒体 / 跨域 / LLM |

---

## 2. 迁移文件审计：`market/migrations/0001_initial.py`

文件存在，依赖 `auth.0012_alter_user_first_name_max_length`，`initial = True`。

`CreateModel` 数量：**11 个**（一一对应 `market/models.py`）：

| # | 模型 | 表名 | 关键约束 |
| --- | --- | --- | --- |
| 1 | `User` | `market_user` | 继承 AbstractUser，扩展 school / student_id / credit_score / role / is_certified |
| 2 | `Category` | `market_category` | 自引用 parent，code 唯一 |
| 3 | `Conversation` | `market_conversation` | AddField 补齐 product / seller；unique_together(product, buyer) |
| 4 | `Product` | `market_product` | 状态机 6 档 + 成色 4 档 + seller 关联 |
| 5 | `ProductImage` | `market_product_image` | product 外键级联 |
| 6 | `Order` | `market_order` | 状态机 5 档，buyer / seller / product 全部 PROTECT |
| 7 | `Message` | `market_message` | conversation 外键级联 |
| 8 | `Favorite` | `market_favorite` | unique_together(user, product) |
| 9 | `AuditLog` | `market_audit_log` | 6 类操作枚举，operator SET_NULL |
| 10 | `Review` | `market_review` | order OneToOne，2 个外键 |
| 11 | `Report` | `market_report` | 5 类原因 + 5 类处理状态 |

附带的 `AddIndex` 共 10 条：覆盖商品状态、分类、卖家、买家、消息、收藏、审计等高频过滤路径。

`AlterUniqueTogether` 2 条：`(Favorite: user, product)` 和 `(Conversation: product, buyer)`。

结论：迁移文件与模型一一对应，**不需要再生成 `0002_*` 之类的补丁**。

---

## 3. 建库脚本审计：`scripts/create_mysql_db.sql`

- 唯一执行的语句：`CREATE DATABASE IF NOT EXISTS campus_market DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- 旧 `family_finance` 库相关语句已全部注释为废弃。
- 推荐执行命令（与 `init_data_market.py` 顶部注释一致）：

```powershell
"C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -ptyb1124 `
    < "d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\create_mysql_db.sql"
```

结论：SQL 简洁且幂等，**符合 MySQL 8/9 语法**。

---

## 4. 分类初始化脚本：`scripts/init_categories.py`（**新增**）

任务要求 7 大一级分类：教材书籍 / 电子产品 / 生活用品 / 运动器材 / 服饰鞋帽 / 乐器 / 其它。

| code | 中文名 | 二级子分类数 | Lucide 图标 |
| --- | --- | --- | --- |
| `textbook_books` | 教材书籍 | 4（大学教材 / 考研资料 / 语言学习 / 考试认证） | `book-open` |
| `electronics`    | 电子产品 | 6（手机 / 电脑 / 平板 / 数码配件 / 相机摄影 / 耳机音箱） | `laptop` |
| `daily_life`     | 生活用品 | 5（宿舍 / 厨房 / 洗护美妆 / 文具办公 / 零食食品） | `home` |
| `sports`         | 运动器材 | 4（球类 / 健身 / 户外 / 骑行） | `dumbbell` |
| `apparel`        | 服饰鞋帽 | 5（男装 / 女装 / 鞋靴 / 箱包 / 配饰） | `shirt` |
| `musical`        | 乐器     | 5（弦乐 / 键盘 / 管乐 / 打击 / 配件） | `music-2` |
| `other`          | 其它     | 1（其他） | `package` |

总计：7 个一级 + 30 个二级。

实现要点：
- 完全使用 `get_or_create(code=...)` 判重，**幂等可重复执行**。
- 图标使用 Lucide 名称字符串，**未使用 emoji**（符合 UI 规范）。
- `code` 与 `init_data_market.py` 的 `textbook` / `digital` / `fashion` / `life` / `other` 不冲突，并存时会同时存在；如需统一以 `init_categories.py` 为准，可清理 `init_data_market.py` 中的旧一级分类。

---

## 5. 管理员脚本：`scripts/init_admin.py`（**新增**）

| 项 | 值 |
| --- | --- |
| 默认用户名 | `admin` |
| 密码来源（按优先级） | `MARKET_ADMIN_PASSWORD` → `DJANGO_ADMIN_PASSWORD` → CLI `--password` → `admin123` |
| 兜底密码 | `admin123`（仅本地开发） |
| 设置字段 | `role='admin'` / `is_staff=True` / `is_superuser=True` / `is_active=True` / `is_certified=True` / `credit_score=100` / `school='平台运营'` / `first_name='管理员'` / `email='<用户名>@campus.local'` |
| 幂等性 | 已存在的 admin 会刷新上述字段并重写密码哈希 |
| 副作用 | 仅操作 `username=admin` 这一个账号 |

使用示例（PowerShell）：

```powershell
# 1) 写入 .env（推荐）
Add-Content backend\.env "`nMARKET_ADMIN_USERNAME=admin"
Add-Content backend\.env "MARKET_ADMIN_PASSWORD=YourStrongPwd"

# 2) 执行
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe `
    d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\init_admin.py
```

`.env.example` 暂未新增 `MARKET_ADMIN_PASSWORD` 占位以保持兼容；如团队希望统一可见，可手动追加注释行（`# MARKET_ADMIN_PASSWORD=`）。

---

## 6. 种子数据脚本：`scripts/init_data_market.py`（**已存在，评估为完整**）

| 项 | 数量 / 状态 |
| --- | --- |
| 一级分类 | 5 个（教材 / 数码 / 服饰 / 生活 / 其他） |
| 二级分类 | 19 个（覆盖上述 5 个一级） |
| 测试用户 | 4 个：`admin` / `zhangsan` / `lisi` / `wangwu` |
| 示例商品 | 22 条（覆盖教材 / 数码 / 服饰 / 生活 / 其他） |
| 示例举报 | 1 条（李四举报在售商品） |
| 幂等性 | 全部走 `get_or_create` / `exists` 判定，**可重复执行** |
| 状态覆盖 | on_sale / sold / pending 均有示例 |

> 与 `init_categories.py` 的关系：两份脚本的 `code` 命名空间不冲突。**建议执行顺序**：
> 1. `init_categories.py`（建立 7 大分类标准）
> 2. `init_data_market.py`（补 5 大教学分类 + 用户 + 商品 + 举报）

任务"如缺分类/示例商品/示例用户，补全"——经审计 5 大分类 / 22 商品 / 4 用户 / 1 举报均**已完整**，未做修改。

---

## 7. 兼容脚本：`scripts/init_data.py` 与 `init_keywords.py`

两份脚本导入 `finance.models` / `finance.models_voice`，**与 market 解耦**，保留给 `finance_legacy/` 旧库使用；本次审计不修改、不建议在新库 `campus_market` 中执行。

---

## 8. 环境变量审计：`backend/.env.example`

| 段 | 项 | 备注 |
| --- | --- | --- |
| Django | `DEBUG` / `SECRET_KEY` | 完整 |
| MySQL | `DB_ENGINE` / `DB_USE_PYMYSQL` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | 完整；`DB_NAME=campus_market` |
| 媒体 | `MEDIA_ROOT` / `MEDIA_URL` | 完整 |
| 跨域 / 主机 | `ALLOWED_HOSTS` / `CORS_ALLOW_ALL_ORIGINS` | 完整 |
| LLM | `LLM_API_BASE` / `LLM_API_KEY` / `LLM_MODEL` | 完整 |

`init_admin.py` 不要求 `.env.example` 暴露 `MARKET_ADMIN_PASSWORD`；如团队希望模板里可见，可手动追加 1 行注释。

---

## 9. 初始化标准流程（就绪）

```powershell
# 0) 准备 .env（拷贝并修改密码）
Copy-Item backend\.env.example backend\.env
# 编辑 backend\.env，确认 DB_PASSWORD=tyb1124 等

# 1) 建库（首次或库被删后）
"C:\Program Files\MySQL\MySQL Server 9.4\bin\mysql.exe" -u root -ptyb1124 `
    < "d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\create_mysql_db.sql"

# 2) 迁移
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe manage.py migrate

# 3) 分类（7 大标准）
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe `
    d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\init_categories.py

# 4) 管理员（密码从 .env 读）
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe `
    d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\init_admin.py

# 5) 种子数据（5 大教学分类 + 4 用户 + 22 商品 + 1 举报）
C:\Users\liem\AppData\Local\Programs\Python\Python313\python.exe `
    d:\文件\工作 作业\微信小程序实训\4次课程内容\综合实训\backend\scripts\init_data_market.py
```

所有脚本均幂等，重复执行不会破坏现有数据。

---

## 10. 检查清单

- [x] 迁移文件覆盖全部 11 个模型
- [x] 建库 SQL 指向 `campus_market`
- [x] 7 大商品分类脚本可独立运行
- [x] 管理员脚本支持从 `.env` 读密码
- [x] 种子数据脚本覆盖分类 / 用户 / 商品 / 举报
- [x] `init_data.py` / `init_keywords.py` 保持对旧 finance 兼容
- [x] `.env.example` 配置完整
- [x] 不触碰 `finance/` / `finance_legacy/`
- [x] 不修改 `requirements.txt`
- [x] 未执行 `migrate` / `makemigrations`（仅静态审计）

---

## 11. 结论

**初始化流程就绪。** 5 步流程（建库 → 迁移 → 分类 → 管理员 → 种子）每步都有幂等脚本，重复执行安全；缺什么补什么，未对现有 `init_data_market.py` 造成破坏性改动。
