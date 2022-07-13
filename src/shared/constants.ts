export const SSR_ATTR = 'data-server-rendered'


//component：组件、directive自定义指令、filter：过滤器
export const ASSET_TYPES = ['component', 'directive', 'filter'] as const

export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated', // keep-live特有
  'deactivated', // keep-live特有
  'errorCaptured', // 全局生命函数
  'serverPrefetch' // 全局生命函数
] as const
