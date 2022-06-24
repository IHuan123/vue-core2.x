import { ASSET_TYPES } from 'shared/constants'
import type { Component } from 'types/component'
import type { GlobalAPI } from 'types/global-api'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'
import { log } from '../util/debug'
export function initExtend(Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: any): typeof Component {
    log("#00C853","init.ts method(Vue.extend)>variable(extendOptions):",extendOptions)
    extendOptions = extendOptions || {}
    const Super = this // this就是Vue本身
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    if (__DEV__ && name) {
      validateComponentName(name)
    }
    // Vue子类构造函数
    const Sub = function VueComponent(this: any, options: any) {
      this._init(options)
    } as unknown as typeof Component
    Sub.prototype = Object.create(Super.prototype)
    
    // 将VueComponent设为构造函数，这里解决修改原型对象中构造函数指向错误的问题
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    log("#00C853","init.ts method(Vue.extend)>variable(Super.options):",Super.options)
    Sub.options = mergeOptions(Super.options, extendOptions)
    Sub['super'] = Super //设置父级

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 对于 props 和计算属性，我们在扩展时在扩展原型上的 Vue 实例上定义代理 getter。这避免了对创建的每个实例的 Object.defineProperty 调用。
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 在扩展时保留对父级选项的引用。稍后在实例化时，我们可以检查 Super 的选项是否已经更新。
    Sub.superOptions = Super.options //缓存保留父级options
    Sub.extendOptions = extendOptions //当前传入的options
    Sub.sealedOptions = extend({}, Sub.options) // 缓存当前合并后的options
    console.dir(Sub)
    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps(Comp: typeof Component) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed(Comp: typeof Component) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
