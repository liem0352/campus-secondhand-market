/**
 * 演示账号(测试 / 教学用)
 * 集中管理以便快速调整或注释掉
 * 注意:仅用于本地与教学演示,生产环境务必清空或使用真实账号
 */

/** 默认密码(普通用户) */
export const DEMO_PASSWORD_DEFAULT = '123456'

/** 管理员密码 */
export const DEMO_PASSWORD_ADMIN = 'admin123'

/**
 * 角色中文映射(内联)
 * - C 端用户留空,前端只显示一个色点徽章
 * - 管理员保留文字徽章
 */
const DEMO_ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  c_user: '',
}

/**
 * 角色徽章颜色映射
 * 选用 style.css 中已定义的语义色 token,避免使用不存在的 -500 后缀
 */
const DEMO_ROLE_COLOR: Record<string, string> = {
  c_user: '--color-primary-500',  // 暖橙(主色 9 阶)
  buyer: '--color-info',          // 蓝(信息色)
  seller: '--color-success',      // 绿(成功色)
  admin: '--color-error',         // 红(错误色)
}

/** 演示账号接口 */
export interface DemoAccount {
  /** 角色徽章文案(空串则只渲染色点) */
  role: string
  /** 用户名(用于回显) */
  username: string
  /** 登录密码 */
  password: string
  /** 角色徽章颜色(CSS 变量名) */
  colorVar: string
  /** 是否为管理员(决定使用 admin 密码) */
  isAdmin?: boolean
}

/** 演示账号列表(登录页一键填充) */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: DEMO_ROLE_LABEL.c_user, username: 'zhangsan', password: DEMO_PASSWORD_DEFAULT, colorVar: DEMO_ROLE_COLOR.c_user },
  { role: DEMO_ROLE_LABEL.c_user, username: 'lisi',     password: DEMO_PASSWORD_DEFAULT, colorVar: DEMO_ROLE_COLOR.buyer },
  { role: DEMO_ROLE_LABEL.c_user, username: 'wangwu',   password: DEMO_PASSWORD_DEFAULT, colorVar: DEMO_ROLE_COLOR.seller },
  { role: DEMO_ROLE_LABEL.admin,  username: 'admin',    password: DEMO_PASSWORD_ADMIN,   colorVar: DEMO_ROLE_COLOR.admin, isAdmin: true },
]

/** 默认密码提示文案 */
export const DEMO_PASSWORD_HINT = {
  TITLE: '默认密码',
  NORMAL: '所有演示账号的密码均为',
  ADMIN_HINT: '管理员除外',
  CODES: {
    NORMAL: DEMO_PASSWORD_DEFAULT,
    ADMIN: DEMO_PASSWORD_ADMIN,
  },
} as const
