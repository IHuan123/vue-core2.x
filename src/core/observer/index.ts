import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  isArray,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering,
  hasChanged
} from '../util/index'
import { log } from '../util/debug'
import { isReadonly, isRef, TrackOpTypes, TriggerOpTypes } from '../../v3'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

const NO_INIITIAL_VALUE = {}



/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving(value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * 附加到每个观察到的对象的观察者类。一旦附加，观察者将目标 
 * 对象的属性键转换为 
 * 收集依赖项和调度更新的 getter/setter。
 */
export class Observer {
  dep: Dep
  vmCount: number // number of vms that have this object as root $data

  constructor(public value: any, public shallow = false) {
    // this.value = value
    // 如果给一个对象添加一个不存在的属性，我希望也能更新视图{}.dep
    // 创建依赖收集的容器，给对象和数组都增加dep属性
    this.dep = new Dep() 
    log("#BA68C8","observer/index.ts var(dep):",this.dep)
    this.vmCount = 0
    //设置一个__ob__属性引用当前observer实例，为每一个监控的属性都添加一个——__ob__
    // 必须使用Object.defineProperty这个来添加__ob__，这样时防止在每次递归响应化时都会对__ob__做处理，以下方法可以设置__ob__不可枚举和配置，在遍历时就无法获取，防止死循环
    def(value, '__ob__', this) 
    //判断类型
    if (isArray(value)) {
      //如果是数组，替换数组对象的原型
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      //如果数组里面元素是对象还需要做响应化处理
      if (!shallow) {
        this.observeArray(value)
      }
    } else {
      //walk方法，将每个值进行响应化处理
      this.walk(value, shallow)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * * 遍历所有属性并将它们转换为getter/setter。仅当值类型为 Object 时才应调用此方法。
   */
  walk(obj: object, shallow: boolean) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      defineReactive(obj, key, NO_INIITIAL_VALUE, undefined, shallow)
    }
  }

  /**
   * Observe a list of Array items.
   * 对数组进行响应化
   */
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 * 通过使用 __proto__ 拦截原型链来扩充目标对象或数组
 */
function protoAugment(target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 * 通过定义隐藏属性来增强目标对象或数组。
 */
/* istanbul ignore next */
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,* 尝试为一个值创建一个观察者实例， 
 * returns the new observer if successfully observed,* 如果成功观察，则返回新观察者， 
 * or the existing observer if the value already has one.* 如果值已经有一个，则返回现有观察者。
 * value 就是data
 */
export function observe(value: any, shallow?: boolean): Observer | void {
  // log("#BA68C8","observer params value:",value)
  // 判断value类型
  if (!isObject(value) || isRef(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value.__v_skip
  ) {
    ob = new Observer(value, shallow)
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 在一个对象上定义一个反应属性。
 */
export function defineReactive(
  obj: object,
  key: string,
  val?: any,
  customSetter?: Function | null,
  shallow?: boolean
) {
  //和Key一一对应，这个dep是专门给对象使用的
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if (
    (!getter || setter) &&
    (val === NO_INIITIAL_VALUE || arguments.length === 2)
  ) {
    val = obj[key]
  }
  //childOb是子集的Observer实例
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) { //如果存在watcher依赖
        //依赖收集(__DEV__开发模式 一般不看)
        if (__DEV__) {
          dep.depend({
            target: obj,
            type: TrackOpTypes.GET,
            key
          })
        } else {
          //每个属性都对应着自己的一个watcher
          // dep.depend可以储存watcher
          dep.depend() 
        }
        if (childOb) {
          //如果存在子obj，子obj也收集这个依赖？为什么要这么做？作用：Obj和父变了和子改变了都会通知进行更新。例：在访问时{obj.foo}无论是Obj变了还是obj.foo的值变了都会通知进行更新。
          childOb.dep.depend() // 让数组和对象也记住当前的watcher
          if (isArray(value)) { // 可能是数组套数组的可能
            dependArray(value)  
          }
        }
      }
      // isRef 为了识别Vue3中的ref类型
      return isRef(value) ? value.value : value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      if (!hasChanged(value, newVal)) {
        return
      }
      if (__DEV__ && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else if (getter) {
        // #7981: for accessor properties without setter
        return
      } else if (isRef(value) && !isRef(newVal)) {
        value.value = newVal
        return
      } else {
        val = newVal
      }
      //当设置的值是一个对象或者数组时，再次进行数据拦截
      childOb = !shallow && observe(newVal) 
      if (__DEV__) {
        dep.notify({
          type: TriggerOpTypes.SET,
          target: obj,
          key,
          newValue: newVal,
          oldValue: value
        })
      } else {
        dep.notify() // 通知依赖watcher进行一个更新操作
      }
    }
  })
  log("#BA68C8","observer/index.ts var(dep):",dep)
  return dep
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set<T>(array: T[], key: number, value: T): T
export function set<T>(object: object, key: string | number, value: T): T
export function set(
  target: any[] | Record<string, any>,
  key: any,
  val: any
): any {
  if (__DEV__ && (isUndef(target) || isPrimitive(target))) {
    warn(
      `Cannot set reactive property on undefined, null, or primitive value: ${target}`
    )
  }
  if (isReadonly(target)) {
    __DEV__ && warn(`Set operation on key "${key}" failed: target is readonly.`)
    return
  }
  if (isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target as any).__ob__
  if ((target as any)._isVue || (ob && ob.vmCount)) {
    __DEV__ &&
      warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
          'at runtime - declare it upfront in the data option.'
      )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  if (__DEV__) {
    ob.dep.notify({
      type: TriggerOpTypes.ADD,
      target: target,
      key,
      newValue: val,
      oldValue: undefined
    })
  } else {
    ob.dep.notify()
  }
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del<T>(array: T[], key: number): void
export function del(object: object, key: string | number): void
export function del(target: any[] | object, key: any) {
  if (__DEV__ && (isUndef(target) || isPrimitive(target))) {
    warn(
      `Cannot delete reactive property on undefined, null, or primitive value: ${target}`
    )
  }
  if (isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target as any).__ob__
  if ((target as any)._isVue || (ob && ob.vmCount)) {
    __DEV__ &&
      warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
          '- just set it to null.'
      )
    return
  }
  if (isReadonly(target)) {
    __DEV__ &&
      warn(`Delete operation on key "${key}" failed: target is readonly.`)
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  if (__DEV__) {
    ob.dep.notify({
      type: TriggerOpTypes.DELETE,
      target: target,
      key
    })
  } else {
    ob.dep.notify()
  }
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 收集数组的watcher
 * 处理嵌套数组的watcher依赖收集
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    if (e && e.__ob__) {
      e.__ob__.dep.depend()
    }
    if (isArray(e)) {
      dependArray(e)
    }
  }
}
