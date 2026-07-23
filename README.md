<img src="assets/readme/hero.svg" alt="校园二手交易平台 — Django + DRF 后端为中心,汇聚微信小程序买家端、Vue3 卖家工作台、Web 管理后台三前端,下方对接 MySQL 持久化" width="100%"/>

# 校园二手交易平台

一个基于 **Django + DRF + MySQL + Vue3 + 微信小程序** 的 C2C 校园二手交易平台,整合 4 次实训,支持"一后端 + 三前端"端到端联调。

---

## 架构证明

> 真实目录结构与业务域,作为项目存在与完整性的直接证据。

### 目录结构

```
campus-secondhand-market/
├── backend/                       # Django + DRF 后端(:8000)
│   ├── config/                    # 项目配置(settings / urls / wsgi)
│   ├── market/
│   │   ├── models.py              # User / Product / Category / Order / Review
│   │   ├── views/                 # auth / product / order / message / ai / admin
│   │   ├── serializers/           # DRF 序列化器
│   │   └── services/              # ai_service / llm_client / asr_adapter
│   ├── migrations/                # 数据库迁移
│   ├── finance_legacy/            # [已下线] 家庭记账旧代码,保留以备追溯
│   └── scripts/                   # 运维与种子脚本
├── frontend-web/                  # Vue3 + TS + Element Plus(:3000)卖家工作台
├── 小程序前端/                     # 原生微信小程序(买家 C 端)
└── 管理后台/                       # Web 管理后台(平台运营)
```

### 业务域

| 业务域 | 核心能力 | 主要前端入口 |
|--------|----------|--------------|
| 用户 | 注册 / 登录 / 鉴权 / 信用分 | 小程序 · 管理后台 |
| 商品 | 发布 / 分类 / 上下架 / 搜索 | 卖家工作台 · 小程序 |
| 订单 | 下单 / 状态流转 | 小程序 · 卖家工作台 |
| 私聊 | 买卖双方交易前沟通 | 小程序 |
| 评价 | 交易后信誉反馈 | 小程序 |
| 信用分 | 信任度量 / 平台风控信号 | 管理后台 |
| AI | LLM 智能辅助 + ASR 语音适配 | 小程序 · 卖家工作台 |

---

## 这是什么

一个校园场景下的 C2C 二手交易平台:学生通过微信小程序发布、浏览、下单、私聊、评价二手商品,卖家在 Web 工作台管理商品与订单,平台运营方在 Web 管理后台监控信用与交易。

## 为什么不同

- **一后端三前端**:同一套 Django + DRF 后端同时服务三类前端,真实多端联调,而非单端演示。
- **C2C 全链路**:覆盖发布 → 沟通 → 下单 → 评价 → 信用积累的完整交易闭环。
- **AI 辅助内置**:LLM 客户端与 ASR 适配器作为后端服务层的一等公民,而非外挂脚本。
- **实训整合**:4 次实训的成果沉淀在同一仓库,`finance_legacy/` 保留旧业务代码以备教学追溯。

## 工作原理

```
微信小程序(买家 C 端)  ─┐
                         ├──▶  Django + DRF 后端(:8000)  ──▶  MySQL
Vue3 卖家工作台(:3000) ─┤         │
                         │         ├── auth / product / order
Web 管理后台(运营)    ─┘         ├── message / review / admin
                                   └── services / ai_service / llm_client / asr_adapter
```

- **后端分层**:`models` 定义领域实体,`views` 暴露 RESTful 接口,`serializers` 处理序列化,`services` 承载 AI 与外部适配逻辑。
- **三前端协作**:小程序面向买家,Vue3 工作台面向卖家,Web 管理后台面向平台运营,共用同一套 API。
- **MySQL 持久化**:用户、商品、订单、评价等核心实体落库,迁移文件随版本演进。
- **旧代码隔离**:`finance_legacy/` 已下线但不删除,保留实训演进轨迹。

---

## 快速开始

### 后端(Django + DRF,:8000)

```bash
cd backend

# 创建并激活虚拟环境
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量(数据库连接、密钥等),按 .env.example 填写 .env

# 数据库迁移
python manage.py migrate

# 启动开发服务器(监听所有网卡,便于真机调试小程序)
python manage.py runserver 0.0.0.0:8000
```

### 前端卖家工作台(Vue3 + TS,:3000)

```bash
cd frontend-web

npm install

npm run dev
# 浏览器访问 http://localhost:3000
```

### 微信小程序与管理后台

- **小程序前端**:用微信开发者工具打开 `小程序前端/` 目录,在 `project.config.json` 中将后端地址指向 `http://<本机IP>:8000`。
- **管理后台**:按 `管理后台/` 内的说明文档启动,默认对接同一后端。

---

## 业务模块

<img src="assets/readme/section-business.svg" alt="7 大业务域:用户、商品、订单、私聊、评价、信用分、AI,覆盖 C2C 校园交易全链路" width="100%"/>

| 模块 | 说明 |
|------|------|
| 用户 | 注册、登录、JWT 鉴权、信用分初始分与历史记录 |
| 商品 | 发布、分类、上下架、关键词搜索、图片上传 |
| 订单 | 下单、状态流转(待支付 / 待发货 / 已完成 / 已取消) |
| 私聊 | 买卖双方交易前即时沟通,支持文本与图片消息 |
| 评价 | 交易完成后双向评价,影响信用分 |
| 信用分 | 综合评价与交易历史的信任度量,作为平台风控信号 |
| AI | LLM 智能辅助(商品描述生成 / 客服问答)+ ASR 语音输入适配 |

### 关于 `finance_legacy/`

早期"家庭记账"业务代码,已下线但保留在仓库中,用于教学追溯与实训演进对比。新业务请勿依赖该目录。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Django · Django REST Framework · MySQL |
| 卖家工作台 | Vue3 · TypeScript · Element Plus(:3000) |
| 买家端 | 原生微信小程序 |
| 管理后台 | Web 管理后台(平台运营) |
| AI 服务 | LLM 客户端 · ASR 适配器 |

---

## License

MIT License · 作者 liem · 4 实训整合
