import type { GlobalAPI } from 'types/global-api'
import { toArray, isFunction } from '../util/index'

// 注册插件的方法
export function initUse(Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | any) {
    // 获取安装的插件，如何没有任何插件，this._installedPlugin初始化为[]
    const installedPlugins =
      this._installedPlugins || (this._installedPlugins = [])
      // 判断当前是否存在该插件，如果存在就不再重复注册
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // args：获取options
    const args = toArray(arguments, 1)
    // 将args第一位设为Vue本身，在install方法中传入的参数应为(Vue,...options)
    args.unshift(this)
    if (isFunction(plugin.install)) {
      plugin.install.apply(plugin, args)
    } else if (isFunction(plugin)) {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
