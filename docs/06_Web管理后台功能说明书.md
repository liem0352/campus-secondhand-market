# Web 管理后台功能说明书

| 属性 | 内容 |
|------|------|
| **文档编号** | CM-WEB-001 |
| **文档名称** | 校园二手交易平台 · Web 管理后台功能说明书 |
| **版本** | v1.0 |
| **密级** | 内部公开 |
| **编制人** | 课程组（Trae IDE 协助） |
| **审核人** | 课程负责人 |
| **批准人** | 课程负责人 |
| **编制日期** | 2026-06-15 |
| **生效日期** | 2026-06-15 |
| **替代版本** | FF-WEB-001 v3.1（家庭资产管理版本，已废止） |
| **代码位置** | `frontend-admin/` |
| **配套 API** | `/api/admin/*` |

---

## 文档修订记录

| 版本 | 日期 | 变更摘要 | 编制人 |
|------|------|----------|--------|
| v1.0 | 2026-06-15 | 全新改版：从「家庭记账 B 端」切换为「校园二手 B 端管理后台」；菜单重构为仪表盘/商品审核/用户管理/举报处理/分类管理/审计日志/AI 配置；采用 Vue 3.5 + Element Plus | 课程组 |

---

## 目录

- [1. 概述](#1-概述)
- [2. 技术栈与目录结构](#2-技术栈与目录结构)
- [3. 路由与菜单](#3-路由与菜单)
- [4. 全局配置](#4-全局配置)
- [5. 状态管理（Pinia）](#5-状态管理pinia)
- [6. 公共布局与组件](#6-公共布局与组件)
- [7. 登录守卫与权限](#7-登录守卫与权限)
- [8. 各页面功能说明](#8-各页面功能说明)
- [9. Axios 拦截器与错误处理](#9-axios-拦截器与错误处理)
- [10. ECharts 配置规范](#10-echarts-配置规范)
- [11. 表单与错误码映射](#11-表单与错误码映射)
- [12. 响应式与无障碍](#12-响应式与无障碍)
- [13. 部署与构建](#13-部署与构建)
- [14. 关联文档](#14-关联文档)

---

## 1. 概述

### 1.1 目标

本文档面向**前端工程师 / 测试工程师 / 答辩学生**，逐页说明校园二手交易平台 **Web 管理后台（`frontend-admin/`）**：

- 路由 / 菜单 / 权限
- 全局布局与公共组件
- 各页面的字段、API 映射、交互细节
- Axios 拦截器、ECharts 配置、错误码映射
- 响应式断点与无障碍要点

### 1.2 业务范围

Web 管理后台为**平台管理员**提供以下能力：

| 能力 | 价值 |
|------|------|
| 仪表盘 | 一图看全平台关键指标（用户数、商品数、订单数、待审核数） |
| 商品审核 | 审核用户发布的商品（通过 / 驳回） |
| 用户管理 | 查看用户、封禁 / 解封、调整信用分 |
| 举报处理 | 处理用户对商品的举报（警告 / 下架 / 封禁 / 驳回） |
| 分类管理 | CRUD 商品分类（一级 / 二级） |
| 审计日志 | 关键运营动作的留痕回溯 |
| AI 配置 | 运行时调整 AI 提示词、限流阈值 |

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| 信息密度高 | 后台重效率不重美观，单屏内展示更多信息 |
| 操作可逆 | 关键操作有"二次确认"对话框（封禁、删除、调分） |
| 状态可观察 | 列表项显示状态徽章 + 状态机切换提示 |
| 错误可恢复 | 失败后保留表单数据 + Toast 报错 |
| 可审计 | 所有写操作都对应 `AuditLog`，前端用 `X-Audit-Reason` 头携带原因 |

### 1.4 用户角色

| 角色 | 描述 | 入口 |
|------|------|------|
| 平台管理员 (admin) | 平台运营人员，全部菜单可见 | `POST /api/auth/login/` 登录后进入 `/` |

> 普通卖家**不**使用本后台；他们使用 [`frontend-web/`（卖家工作台）](#)。本文档不涵盖卖家台。

---

## 2. 技术栈与目录结构

### 2.1 技术栈

| 维度 | 选择 | 版本 |
|------|------|------|
| 框架 | Vue 3 Composition API | 3.5.x |
| 语言 | JavaScript（不强制 TS） | ES2022 |
| 路由 | Vue Router | 4.x |
| 状态 | Pinia | 2.x |
| UI 库 | Element Plus | 2.x |
| 图表 | ECharts | 5.x |
| HTTP | Axios | 1.x |
| 构建 | Vite | 5.x |
| 代码风格 | ESLint + Prettier | - |

### 2.2 目录结构

```
frontend-admin/
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ api/
│  │  ├─ index.js              # Axios 实例 + 拦截器
│  │  └─ request.js            # 业务 API 模块（按资源拆分）
│  ├─ assets/                  # 静态资源（图片 / 字体）
│  ├─ components/
│  │  ├─ BrandLogo.vue         # 品牌 Logo
│  │  ├─ DataShell.vue         # 列表外壳（带空 / 错 / 加载态）
│  │  ├─ EmptyState.vue        # 空状态
│  │  ├─ ErrorState.vue        # 错误状态
│  │  └─ SkeletonBlock.vue     # 骨架屏
│  ├─ composables/
│  │  └─ useList.js            # 通用列表 hook（分页 / 排序 / 过滤）
│  ├─ layouts/
│  │  └─ MainLayout.vue        # 顶部 + 侧边栏 + 出口
│  ├─ router/
│  │  └─ index.js              # 路由 + 守卫
│  ├─ stores/
│  │  └─ user.js               # Pinia 用户 store
│  ├─ styles/
│  │  └─ liquid-glass.css      # 设计令牌（颜色 / 间距 / 圆角）
│  ├─ views/
│  │  ├─ Login.vue
│  │  ├─ Dashboard.vue         # 仪表盘
│  │  ├─ AuditProducts.vue     # 商品审核
│  │  ├─ Users.vue             # 用户管理
│  │  ├─ Reports.vue           # 举报处理
│  │  ├─ Categories.vue        # 分类管理
│  │  ├─ AiConfig.vue          # AI 配置
│  │  ├─ AuditLogs.vue         # 审计日志
│  │  ├─ Forbidden.vue         # 403 页
│  │  └─ NotFound.vue          # 404 页
│  ├─ App.vue
│  ├─ main.js
│  └─ style.css
├─ .env.development
├─ index.html
├─ package.json
└─ vite.config.js
```

---

## 3. 路由与菜单

### 3.1 路由表

| 路径 | 组件 | 名称 | 鉴权 | 菜单 |
|------|------|------|------|------|
| `/login` | Login.vue | login | 公开 | 隐藏 |
| `/` | MainLayout.vue | main | admin | 外壳 |
| `/dashboard` | Dashboard.vue | dashboard | admin | 仪表盘 |
| `/audit/products` | AuditProducts.vue | audit-products | admin | 商品审核 |
| `/users` | Users.vue | users | admin | 用户管理 |
| `/reports` | Reports.vue | reports | admin | 举报处理 |
| `/categories` | Categories.vue | categories | admin | 分类管理 |
| `/ai-config` | AiConfig.vue | ai-config | admin | AI 配置 |
| `/audit-logs` | AuditLogs.vue | audit-logs | admin | 审计日志 |
| `/403` | Forbidden.vue | forbidden | 公开 | 隐藏 |
| `/:pathMatch(.*)*` | NotFound.vue | not-found | 公开 | 隐藏 |

### 3.2 菜单定义

```javascript
const menus = [
  { path: '/dashboard',     title: '仪表盘',  icon: 'dashboard' },
  { path: '/audit/products', title: '商品审核', icon: 'shield-check' },
  { path: '/users',          title: '用户管理', icon: 'users' },
  { path: '/reports',        title: '举报处理', icon: 'flag' },
  { path: '/categories',     title: '分类管理', icon: 'list-tree' },
  { path: '/ai-config',      title: 'AI 配置',  icon: 'cpu' },
  { path: '/audit-logs',     title: '审计日志', icon: 'history' },
];
```

### 3.3 路由守卫

```javascript
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAuthed = !!userStore.accessToken;
  const isAdmin  = userStore.userInfo?.role === 'admin';

  if (to.name === 'login') return next();
  if (!isAuthed) return next({ name: 'login', query: { redirect: to.fullPath } });
  if (to.meta.requiresAdmin && !isAdmin) return next({ name: 'forbidden' });
  next();
});
```

---

## 4. 全局配置

### 4.1 `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
```

### 4.2 环境变量 `.env.development`

```
VITE_API_BASE_URL=/api
VITE_APP_TITLE=校园二手 · 管理后台
VITE_USE_MOCK=false
```

### 4.3 Element Plus 按需引入

`main.js` 完整注册 Element Plus 以简化开发；生产环境可通过 `unplugin-vue-components` 改造为按需。

---

## 5. 状态管理（Pinia）

### 5.1 `stores/user.js`

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, fetchMe, logout } from '@/api';

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem('admin_token') || '');
  const refreshToken = ref(localStorage.getItem('admin_refresh') || '');
  const userInfo = ref(null);

  const isAuthed = computed(() => !!accessToken.value);
  const isAdmin  = computed(() => userInfo.value?.role === 'admin');

  async function loginAction(payload) {
    const { access, refresh, user_id } = await login(payload);
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('admin_token', access);
    localStorage.setItem('admin_refresh', refresh);
    await fetchMeAction();
  }

  async function fetchMeAction() {
    userInfo.value = await fetchMe();
  }

  async function logoutAction() {
    await logout();
    accessToken.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
  }

  return {
    accessToken, refreshToken, userInfo,
    isAuthed, isAdmin,
    loginAction, fetchMeAction, logoutAction,
  };
});
```

---

## 6. 公共布局与组件

### 6.1 `MainLayout.vue`

| 区块 | 元素 |
|------|------|
| 顶栏 | Logo + 当前路径面包屑 + 管理员头像（下拉：退出） |
| 侧栏 | 菜单（图标 + 标题） |
| 主区 | `<router-view />` + 全局 Loading |
| 底栏 | 版权信息 + 版本号 |

### 6.2 `DataShell.vue`

列表外壳组件，统一处理加载 / 错误 / 空 / 正常四态：

```vue
<DataShell :loading="loading" :error="error" :empty="!list.length" @retry="load">
  <el-table :data="list"> ... </el-table>
</DataShell>
```

### 6.3 `EmptyState.vue` / `ErrorState.vue`

- 空态：图标 + 主标题 + 副标题 + 可选 CTA
- 错误态：图标 + 错误信息 + "重试" 按钮

### 6.4 `SkeletonBlock.vue`

表格 / 卡片加载占位。

---

## 7. 登录守卫与权限

### 7.1 双因素

1. 路由守卫拦截未登录用户 → 跳转 `/login`
2. 后端 `IsAdmin` 权限类二次校验（前端仅做 UI 隐藏）

### 7.2 登录页

| 字段 | 校验 |
|------|------|
| username | 非空，3-32 字符 |
| password | 非空，≥8 字符 |
| 提交 | `POST /api/auth/login/`，成功后 `userStore.loginAction()` |

### 7.3 Token 刷新

- `request.js` 拦截器：收到 401 → 调 `POST /api/auth/refresh/` → 失败则跳 `/login`
- refresh token 存 localStorage，access token 内存持有

---

## 8. 各页面功能说明

### 8.1 仪表盘 `views/Dashboard.vue`

#### 8.1.1 顶部 4 个 KPI 卡

| 卡片 | 端点 | 说明 |
|------|------|------|
| 注册用户 | `GET /admin/dashboard/` | 累计 + 今日新增 |
| 在售商品 | 同上 | on_sale 状态数 |
| 待审核 | 同上 | pending 状态数 |
| 今日订单 | 同上 | created_at ≥ 今日 00:00 |

#### 8.1.2 趋势图

- ECharts 折线图，7 日 / 30 日切换
- 接口：`GET /admin/dashboard/trend/?days=7`

#### 8.1.3 分类分布

- ECharts 饼图
- 接口：`GET /admin/dashboard/category-distribution/`

#### 8.1.4 快速入口

- 商品审核 / 举报处理 / 用户管理（3 个跳转卡片）

---

### 8.2 商品审核 `views/AuditProducts.vue`

#### 8.2.1 过滤区

- 状态：默认 `pending`，可切换 `on_sale/rejected/off_shelf/sold/pending_sold`
- 分类 / 学校 / 关键词
- 提交时间范围

#### 8.2.2 列表

| 列 | 内容 |
|----|------|
| 封面 | 缩略图 |
| 标题 | + 描述前 50 字 |
| 卖家 | 头像 + 昵称 + 信用 |
| 分类 | 一级 / 二级 |
| 价格 | 主价 + 原价（删除线） |
| 状态 | 徽章 |
| 创建时间 | YYYY-MM-DD HH:mm |
| 操作 | 详情 / 通过 / 驳回 |

#### 8.2.3 详情抽屉

- 滑出右侧 720px 抽屉
- 9 张图轮播、完整描述、卖家卡片、举报记录
- 底部"通过"和"驳回"按钮；驳回弹窗要求填写 `audit_remark`

#### 8.2.4 批量审核

- 勾选多条 → 顶部出现"批量通过 / 批量驳回"
- 驳回必填统一原因

#### 8.2.5 API 映射

| 操作 | 端点 | 入参 |
|------|------|------|
| 列表 | `GET /admin/products/audit/?status=pending&page=1&page_size=20` | - |
| 详情 | `GET /products/{id}/` | - |
| 通过 | `POST /admin/products/{id}/approve/` | `{ remark }` |
| 驳回 | `POST /admin/products/{id}/reject/` | `{ remark }` |
| 批量通过 | `POST /admin/products/audit/batch-approve/` | `{ ids: [], remark }` |
| 批量驳回 | `POST /admin/products/audit/batch-reject/` | `{ ids: [], remark }` |

---

### 8.3 用户管理 `views/Users.vue`

#### 8.3.1 列表

| 列 | 内容 |
|----|------|
| 头像 | - |
| 用户名 | - |
| 学校 | - |
| 学号 | 脱敏：`2024****123` |
| 信用分 | 数字 + 进度条 |
| 角色 | user / admin 徽章 |
| 注册时间 | - |
| 状态 | 启用 / 封禁 |
| 操作 | 详情 / 调整信用 / 封禁 / 解封 |

#### 8.3.2 调整信用分弹窗

- 数值：-100 到 +100
- 原因（必填，≤128 字）
- 二次确认（el-popconfirm）
- 端点：`POST /admin/users/{id}/adjust-credit/`

#### 8.3.3 封禁 / 解封

- 封禁弹窗输入"封禁原因" + 时长（7/30/永久）
- 解封仅需"原因"
- 端点：`POST /admin/users/{id}/ban/` / `unban/`

---

### 8.4 举报处理 `views/Reports.vue`

#### 8.4.1 状态分组

- 顶部 Tab：待处理 / 已警告 / 已下架 / 已封禁 / 已驳回

#### 8.4.2 列表

| 列 | 内容 |
|----|------|
| 举报人 | 头像 + 昵称 |
| 被举报商品 | 缩略图 + 标题 + 卖家 |
| 原因 | fake / prohibited / price / harassment / other |
| 描述 | 前 80 字 |
| 状态 | 徽章 |
| 处理时间 / 处理人 | - |

#### 8.4.3 处理弹窗

- 4 个动作按钮：警告 / 下架 / 封禁 / 驳回
- 备注必填
- 端点：`POST /admin/reports/{id}/handle/`

```json
{
  "action": "warn",   // warn / remove / ban / reject
  "remark": "已电话提醒卖家重新描述"
}
```

---

### 8.5 分类管理 `views/Categories.vue`

#### 8.5.1 树形展示

- Element Plus `<el-tree>`，自定义节点模板
- 节点操作：编辑 / 新增子级 / 删除 / 启用切换

#### 8.5.2 编辑弹窗

| 字段 | 校验 |
|------|------|
| code | 必填，唯一，2-32 字符 |
| name | 必填，1-32 字符 |
| parent | 树形选择器（不可选自己及后代） |
| icon | 文本输入（SVG path / Lucide 名） |
| sort_order | 整数，0-999 |
| is_active | switch |

#### 8.5.3 API

- 树：`GET /admin/categories/`（嵌套）
- CRUD：`POST /admin/categories/` / `PATCH /admin/categories/{id}/` / `DELETE /admin/categories/{id}/`

---

### 8.6 AI 配置 `views/AiConfig.vue`

#### 8.6.1 列表（7 个端点）

| 端点 | key 前缀 | 字段 |
|------|----------|------|
| publish-assist | `ai.publish_assist.*` | system_prompt / temperature / max_tokens |
| price-suggest | `ai.price_suggest.*` | system_prompt / 最低价系数 |
| moderate | `ai.moderate.*` | prohibited_keywords / system_prompt |
| polish | `ai.polish.*` | system_prompt |
| negotiate | `ai.negotiate.*` | min_price_floor_ratio / system_prompt |
| extract-keywords | `ai.extract_keywords.*` | system_prompt |
| customer-service | `ai.customer_service.*` | system_prompt |

#### 8.6.2 编辑表单

- `system_prompt` 走 `<el-input type="textarea" :rows="8">`
- 数值字段用 `<el-input-number>`
- JSON 字段（如关键词列表）走 `<el-input>` + 客户端 JSON 校验

#### 8.6.3 健康检查

- 顶部"AI 服务健康检查"按钮 → `GET /admin/ai/health/`
- 展示：LLM 连通 / 限流状态 / 7 日调用量

#### 8.6.4 端点

- 列表：`GET /admin/ai/config/`
- 更新：`PATCH /admin/ai/config/` `{ key, value }`

---

### 8.7 审计日志 `views/AuditLogs.vue`

#### 8.7.1 过滤

- 操作类型（11 个枚举）
- 操作人 / 目标类型 / 时间范围
- 关键词

#### 8.7.2 列表

| 列 | 内容 |
|----|------|
| 时间 | YYYY-MM-DD HH:mm:ss |
| 操作人 | 头像 + 昵称 |
| 操作 | 枚举徽章 |
| 目标类型 / ID | product / user / report + 数字 |
| 备注 | 前 80 字 |

#### 8.7.3 详情抽屉

- 完整 JSON 视图
- 跳转原资源（商品详情 / 用户详情 / 举报详情）

#### 8.7.4 导出

- 顶部"导出 CSV"按钮 → 调用 `GET /admin/audit-logs/export/`

---

### 8.8 错误页

| 路由 | 组件 | 触发 |
|------|------|------|
| `/403` | Forbidden.vue | 路由守卫检测到非 admin |
| `/:pathMatch(.*)*` | NotFound.vue | 路径未匹配 |

---

## 9. Axios 拦截器与错误处理

### 9.1 `api/request.js` 关键代码

```javascript
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// 请求拦截器：注入 JWT
service.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`;
  }
  // 关键操作携带审计原因
  if (config.auditReason) {
    config.headers['X-Audit-Reason'] = config.auditReason;
  }
  return config;
});

// 响应拦截器：统一处理 code / 401
service.interceptors.response.use(
  (resp) => {
    const { data } = resp;
    if (data && data.code === 0) return data.data;
    if (data && data.code !== 0) {
      ElMessage.error(data.message || '操作失败');
      return Promise.reject(data);
    }
    return data;
  },
  async (error) => {
    const { response } = error;
    if (response?.status === 401) {
      const userStore = useUserStore();
      // 尝试 refresh
      try {
        const r = await axios.post('/api/auth/refresh/', {
          refresh: userStore.refreshToken,
        });
        userStore.accessToken = r.data.access;
        localStorage.setItem('admin_token', r.data.access);
        return service(error.config);
      } catch (e) {
        userStore.logoutAction();
        window.location.href = '/login';
      }
    }
    if (response?.status === 403) ElMessage.error('无权限');
    if (response?.status === 404) ElMessage.error('资源不存在');
    if (response?.status >= 500) ElMessage.error('服务异常');
    return Promise.reject(error);
  }
);

export default service;
```

### 9.2 错误码映射（统一后端 `code` 字段）

| code | 含义 | 前端处理 |
|------|------|----------|
| 0 | 成功 | 正常返回 data |
| 40001 | 参数错误 | 表单字段标红 |
| 40100 | 未登录 | 跳登录 |
| 40300 | 无权限 | 跳 403 |
| 40400 | 资源不存在 | Toast + 返回 |
| 40900 | 状态机冲突 | 重新拉取详情 |
| 42900 | 限流 | Toast "操作过于频繁" |
| 50000 | 服务异常 | Toast + 重新加载 |

---

## 10. ECharts 配置规范

### 10.1 折线图（趋势）

```javascript
const option = {
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: dates,
    axisLine: { lineStyle: { color: '#E5E7EB' } },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed', color: '#F3F4F6' } },
  },
  series: [{
    name: '新增用户',
    type: 'line',
    smooth: true,
    data: counts,
    itemStyle: { color: '#16A34A' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(22,163,74,0.4)' },
          { offset: 1, color: 'rgba(22,163,74,0.05)' },
        ],
      },
    },
  }],
};
```

### 10.2 饼图（分类分布）

```javascript
const option = {
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    data: items.map(i => ({ name: i.name, value: i.count })),
    label: { formatter: '{b}\n{d}%' },
  }],
};
```

### 10.3 主题

- 主色：`#16A34A`（与小程序一致）
- 强调色：`#F59E0B`
- 危险色：`#DC2626`
- 文本色：`#1F2329` / `#8A8E99`

---

## 11. 表单与错误码映射

### 11.1 通用校验规则

```javascript
export const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 32, message: '长度 3-32 字符', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]+$/, message: '仅字母数字下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '至少 8 字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入分类 code', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '仅小写字母数字下划线', trigger: 'blur' },
  ],
  sortOrder: [
    { type: 'number', min: 0, max: 999, message: '0-999' },
  ],
};
```

### 11.2 服务端错误码 → 表单字段

后端在 `data.fields` 中返回字段级错误，前端用 `el-form.setFields()` 标红：

```javascript
catch (err) {
  if (err.code === 40001 && err.fields) {
    Object.entries(err.fields).forEach(([k, v]) => {
      formRef.value?.formItems?.[k]?.setFieldError?.(v);
    });
  }
}
```

---

## 12. 响应式与无障碍

### 12.1 断点

| 名称 | 宽度 | 表现 |
|------|------|------|
| xs | < 768px | 侧栏折叠为抽屉 |
| sm | 768-1199px | 侧栏紧凑 + 双列网格 |
| md | 1200-1599px | 侧栏展开 + 表格 |
| lg | ≥ 1600px | 侧栏展开 + 表格 + 右侧详情 |

Element Plus 容器使用 `:xs="24" :sm="12" :md="8"` 自适应。

### 12.2 键盘导航

- Tab 顺序：顶栏 → 侧栏 → 主区
- 表格行支持 `Enter` 进入详情
- 弹窗 `Esc` 关闭

### 12.3 颜色对比

- 所有文本与背景对比度 ≥ 4.5:1
- 状态徽章使用图标 + 文字（不仅靠颜色）

---

## 13. 部署与构建

### 13.1 构建

```bash
cd frontend-admin
npm install
npm run build       # 输出到 dist/
```

### 13.2 部署位置

- `dist/*` → Nginx 静态目录
- 部署脚本：`deploy/start_frontend_admin.ps1`

### 13.3 环境

| 环境 | API base | 端口 |
|------|----------|------|
| dev | `/api` (proxy → 8000) | 5174 |
| staging | `https://staging.api.xxx.com/api` | 5174 |
| production | `https://api.xxx.com/api` | 5174 |

---

## 14. 关联文档

| 文档 | 链接 |
|------|------|
| 需求规格说明书 | [CM-SRS-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/01_需求规格说明书_SRS.md) |
| 概要设计说明书 | [CM-HLD-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/02_概要设计说明书.md) |
| 详细设计说明书 | [CM-LLD-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/03_详细设计说明书.md) |
| 接口设计说明书 | [CM-API-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/08_接口设计说明书.md) |
| 后端服务说明书 | [CM-API-SVC-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/07_后端服务功能说明书.md) |
| UI 与交互规范 | [CM-UI-001](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/10_UI与交互设计规范.md) |
| 部署说明 | [部署说明.md](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/部署说明.md) |
| 设计令牌 | [2026-06-06-design-tokens](file:///d:/文件/工作 作业/微信小程序实训/4次课程内容/综合实训/docs/superpowers/specs/2026-06-06-design-tokens.md) |

---

> **说明**：本文档为全新改版（v1.0），替换旧的 FF-WEB-001 家庭资产管理 B 端版本。卖家工作台（`frontend-web/`）是另一个独立的前端项目，详见后续《Web 卖家工作台功能说明书》或合并到本文档的"附录"章节。
