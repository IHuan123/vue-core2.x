import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'
import type { Component } from 'types/component'
import type { InternalComponentOptions } from 'types/options'
import { EffectScope } from 'v3/reactivity/effectScope'
import { log } from '../util/debug'
let uid = 0

export function initMixin(Vue: typeof Component) {
  //在initMinxin里面定义Vue的原型方法_init
  Vue.prototype._init = function (options?: Record<string, any>) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to mark this as a Vue instance without having to do instanceof
    // check
    // 如果是Vue的实例，则不需要被observe
    vm._isVue = true
    // avoid instances from being observed
    vm.__v_skip = true
    // effect scope
    vm._scope = new EffectScope(true /* detached */)
    // merge options
    //判断是不是一个组件，是的话执行initInternalComponent，否则合并options
    // 所有options都会写入vm.$options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 优化内部组件实例化，因为动态选项合并非常慢，并且内部组件选项都不需要特殊处理。
      initInternalComponent(vm, options as any)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (__DEV__) {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm; //把vm放在_self属性上暴露出去
    initLifecycle(vm); // vm的生命周期相关变量初始化：$parent,$root,$children,$refs等为默认值
    initEvents(vm); //对父组件传入事件添加监听,初始化事件
    initRender(vm); //生命$slots,$createElemnet,渲染相关的
    callHook(vm, "beforeCreate");
    // inject注入数据
    initInjections(vm); // resolve injections before data/props  
    //数据初始化
    initState(vm); //初始化props、data、watch、methods、computed等属性，因此在beforeCreate的钩子函数中获取不到前面的这些定义的属性和方法
    initProvide(vm); // resolve provide after data/props，provide提供数据
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    log("#FF5722","init.ts method(initMixin)>variable(vm):",vm)
    //最终挂载方法 render & mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create((vm.constructor as any).options))
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions!
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor: typeof Component) {
  log("#FF5722","init.ts method(resolveConstructorOptions)>variable(Ctor):",Ctor.options,Ctor.super?.options)
  let options = Ctor.options
  if (Ctor.super) { // 判断是否为子类
    // 获取父级的options
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 获取缓存的父级options
    const cachedSuperOptions = Ctor.superOptions
    // 判断父级options和缓存的父级options是否相同，如果不同就更新最新父级的options
    if (superOptions !== cachedSuperOptions) {
      log("#FF5722","init.ts method(resolveConstructorOptions):","更新superOptions")
      // super option changed,
      // need to resolve new options.
      // 将父级options更新到最新状态
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 更新基础扩展选项
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
// 获取到已更新到配置
function resolveModifiedOptions(
  Ctor: typeof Component
): Record<string, any> | null {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
