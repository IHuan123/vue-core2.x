/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 * 不对这个文件进行类型检查，因为流不能很好地配合动态访问数组原型上的方法
 * 这个文件主要对array的方法进行重写
 */

import { TriggerOpTypes } from '../../v3'
import { def } from '../util/index'

const arrayProto = Array.prototype
//以Array的原型创建一个对象
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator(...args) {
    // 调用的原生数组方法
    const result = original.apply(this, args)
    const ob = this.__ob__ //observe的实例
    // push unshift添加的元素可能是一个对象
    let inserted //当前要插入的数据，
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2) // 获取要插入的数据
        break
    }
    if (inserted) ob.observeArray(inserted) //在插入数据时要对这些数据进行数据响应式处理
    // notify change 通知
    if (__DEV__) {
      ob.dep.notify({
        type: TriggerOpTypes.ARRAY_MUTATION,
        target: this,
        key: method
      })
    } else {
      ob.dep.notify()
    }
    return result
  })
})
console.log("重写后的arrayMethods:",arrayMethods)