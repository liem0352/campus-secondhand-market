<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="campus-secondhand-market 校园二手交易平台,Django + DRF + Vue3 + 微信小程序,一后端三前端">
</p>

# 校园二手交易平台

基于 Django + DRF + MySQL + Vue3 + 微信小程序构建的 **C2C 校园二手交易平台**，整合课程 4 次实训（Day01 ~ Day04），支持 **一后端 + 三前端**（小程序 + Web 卖家工作台 + Web 平台管理后台）的端到端联调。在保留原「家庭记账」基础设施的前提下，业务整体转型为校园二手交易领域，并按 `ui-ux-pro-max` 标准做了视觉与体验升级。

## 架构

```
                    ┌─────────────┐
                    │  微信小程序  │  买家端（C 端）
                    └──────┬──────┘
                           │
┌─────────────┐    ┌────────┴────────┐    ┌─────────────┐
│ Web 管理后台 │◄──►│ Django + DRF 后端 │◄──►│ Web 卖家工作台│
│  平台运营    │    │   backend :8000  │    │ Vue3+TS :3000│
└─────────────┘    └────────┬────────┘    └─────────────┘
                           │
                      MySQL 数据库
```

## 技术栈

- **后端**：Django + Django REST Framework + MySQL
- **Web 卖家工作台**：Vue3 + TypeScript + Element Plus（端口 3000）
- **微信小程序**：原生小程序
- **Web 管理后台**：平台运营管理
- **业务域**：用户 / 商品 / 订单 / 私聊 / 评价 / 信用分 / AI

## 项目结构

```
综合实训/
├── backend/                # Django 后端（端口 8000）
│   ├── config/             # Django 项目配置（settings / urls / wsgi）
│   ├── market/             # 业务 App
│   │   ├── models.py       # User / Product / Category / Order / Review / ...
│   │   ├── views/          # auth / product / order / message / ai / admin
│   │   ├── serializers/    # DRF 序列化器
│   │   ├── services/       # ai_service / llm_client / asr_adapter
│   │   └── migrations/
│   ├── finance_legacy/     # 【已下线】原“家庭记账”业务，备份保留
│   ├── scripts/            # 建库 SQL、种子数据、关键词
│   ├── manage.py · requirements.txt · .env
│   └── 安装运行流程.txt
├── frontend-web/           # Web 卖家工作台（端口 3000，Vue3 + TS + Element Plus）
├── 小程序前端/             # 微信小程序（买家端）
└── 管理后台/               # Web 平台管理后台
```

## 快速开始

### 后端（端口 8000）

```bash
cd backend
python -m venv venv && venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env          # 配置 MySQL 等信息
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Web 卖家工作台（端口 3000）

```bash
cd frontend-web
npm install
npm run dev
```

### 微信小程序 / 管理后台

按各目录内说明运行；详细流程见 `backend/安装运行流程.txt`。

## 业务模块

- **用户**：注册、登录、鉴权、信用分
- **商品**：发布、分类、上下架、搜索
- **订单**：下单、状态流转
- **私聊**：买卖双方沟通
- **评价**：交易后互评
- **AI**：ai_service / llm_client / asr_adapter 智能辅助

## 说明

- 原「家庭记账」业务代码保留在 `backend/finance_legacy/` 供参考，已下线
- 视觉与体验按 `ui-ux-pro-max` 标准升级

## 作者

liem

## License

MIT License

---

<p align="center"><sub>作者 liem · 校园二手交易平台</sub></p>
