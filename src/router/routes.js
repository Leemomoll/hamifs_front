/**
 * 菜单路由表
 * 说明：所有 component 使用懒加载，避免 layout 与 router 之间产生循环依赖
 */
const Layout = () => import('@/layout/index.vue')

export const constantRoutes = [
  {
    // 登录页独立存在，不挂在 Layout 下
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    // 默认入口走登录页
    path: '/',
    redirect: '/login',
    meta: { hidden: true },
  },
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/index',
    children: [
      {
        path: 'index',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '主控台', icon: 'Odometer', affix: true },
      },
    ],
  },
  {
    path: '/workplace',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Workplace',
        component: () => import('@/views/dashboard/workplace.vue'),
        meta: { title: '工作台', icon: 'Monitor' },
      },
    ],
  },
  {
    // 格式转换：独立页面，上传 → 选目标格式 → 任务列表 → 下载
    path: '/convert',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'ConvertIndex',
        component: () => import('@/views/convert/index.vue'),
        meta: { title: '格式转换', icon: 'Switch' },
      },
    ],
  },
  {
    // 加工工厂：智能表格 / 表格 / 文档的新建与编辑（学企微文档的三段式结构）
    path: '/factory',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Factory',
        component: () => import('@/views/factory/index.vue'),
        meta: { title: 'Hamifs加工工厂', icon: 'Grid' },
      },
    ],
  },
  {
    path: '/hamifs-storage',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'HamifsStorage',
        component: () => import('@/views/hamifs/storage.vue'),
        meta: { title: '文档存储中心', icon: 'FolderOpened' },
      },
    ],
  },
  {
    // 个人记事：备忘 / 待办 / 手记统一入口，按 type 区分
    path: '/memo',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'MemoIndex',
        component: () => import('@/views/memo/index.vue'),
        meta: { title: '个人记事', icon: 'Notebook' },
      },
    ],
  },
  {
    path: '/support',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'SupportHelp',
        component: () => import('@/views/support/help.vue'),
        meta: { title: '建议与帮助客服', icon: 'Service' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统设置', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' },
      },
    ],
  },
  {
    path: '/403',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: '',
        name: 'Page403',
        component: () => import('@/views/error/403.vue'),
        meta: { title: '403', icon: 'WarnTriangleFilled', hidden: true },
      },
    ],
  },
  {
    path: '/404',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: '',
        name: 'Page404',
        component: () => import('@/views/error/404.vue'),
        meta: { title: '404', icon: 'WarningFilled', hidden: true },
      },
    ],
  },
]

/** 兜底路由：未匹配的地址重定向到 404 */
export const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  meta: { hidden: true },
}
