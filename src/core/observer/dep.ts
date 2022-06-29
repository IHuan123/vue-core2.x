// 初始化 data 属性时，递归给 data 的属性，重写 get set，同时会给它们身上都添加一个 Dep 类，

// 渲染阶段 Dep 类会收集 watcher 。每次修改数据会调用 dep.notify() 更新视图
// dep和watcher的关系，一个dep可能对应多个watcher，一个watcher也可能对应多个dep
import { remove } from '../util/index'
import config from '../config'
import { log } from '../util/debug'
import { DebuggerOptions, DebuggerEventExtraInfo } from 'v3'

let uid = 0

/**
 * @internal
 */
export interface DepTarget extends DebuggerOptions {
  id: number
  addDep(dep: Dep): void
  update(): void
}

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * 一个 dep 是一个 observable，可以有多个 指令订阅它。
 * @internal
 */
export default class Dep {
  static target?: DepTarget | null
  id: number //标记当前dep
  subs: Array<DepTarget> //订阅者列表

  constructor() {
    this.id = uid++
    this.subs = []
  }
  //给 dep 添加对应的 watch
  addSub(sub: DepTarget) {
    this.subs.push(sub) //观察者模式
  }

  removeSub(sub: DepTarget) {
    remove(this.subs, sub)
  }
  //给 watcher 添加 Dep
  depend(info?: DebuggerEventExtraInfo) {
    log("#039BE5","observe/dep.ts method(depend)>variable(Dep.target & this):",Dep.target, this)
    // 存在依赖才收集
    if (Dep.target) {
      // 让当前watcher记住这个dep
      Dep.target.addDep(this)
      if (__DEV__ && info && Dep.target.onTrack) {
        Dep.target.onTrack({
          effect: Dep.target,
          ...info
        })
      }
    }
  }
  // 调用 watcher 里的渲染函数
  // 数据更新通知watcher执行update 
  notify(info?: DebuggerEventExtraInfo) {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (__DEV__ && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      if (__DEV__ && info) {
        const sub = subs[i]
        sub.onTrigger &&
          sub.onTrigger({
            effect: subs[i],
            ...info
          })
      }
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// 当前正在评估的目标观察者。这是全局唯一的，因为一次只能评估一个观察者一次。
// Dep的静态属性target
Dep.target = null // 用于缓存当前使用的一个watcher依赖
const targetStack: Array<DepTarget | null | undefined> = [] //用于存放watcher的一个栈，一个数组
// 渲染阶段，访问页面上的属性变量时，添加 watcher
// target参数传入的就是Watcher实例
export function pushTarget(target?: DepTarget | null) {
  targetStack.push(target) //
  Dep.target = target
}
// 访问结束后删除
export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1] 
}
