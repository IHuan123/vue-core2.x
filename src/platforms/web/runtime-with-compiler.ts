import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

// 这文件中在prototype中挂载了$mount
import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import {
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref
} from './util/compat'
import type { Component } from 'types/component'
import type { GlobalAPI } from 'types/global-api'
import { log } from '../../core/util/debug'
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
log("#A5D6A7", "platforms/web/runtime-with-complier.ts 最开始执行位置")
// 这里获取到的$mount是runtime/index.ts中设置的$mount
const mount = Vue.prototype.$mount
log("#FF8F00", "runtime-with-complier.ts const(mount)", mount)
// 这里重写了在runtime/index中的$mount方法
// $mount主要实现了 vue 渲染过程中很重要的一步，得到 render 函数。
// 如果我们使用的 template 进行编写HTML代码，vue 内部会把模板编译成 vue 可识别的 render 函数，如果有写 render 则可以省去编译过程。（ 直接写 render 函数对 vue 编译效率会更好 ）
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  log("#FF8F00", "runtime-with-complier.ts method($mount)")
  // 获取根元素
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    __DEV__ &&
      warn(
        `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
      )
    return this
  }

  const options = this.$options
  log("#FF8F00", "runtime-with-complier.ts method($mount)>var(options)", options)
  // resolve template/el and convert to render function
  /**
 * 编译权重：
 * 优先看有没有render函数，如果有直接用
 * 如果没有render函数就看有没有template模板
 * 如果都没有就直接获取el的outerHTML作为渲染模板
 */
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        // 如何是元素id，则通过id来获取dom
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (__DEV__ && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (__DEV__) {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // @ts-expect-error
      template = getOuterHTML(el)
    }
    log("#FF8F00", "runtime-with-complier.ts method($mount)>var(template):", template)
    if (template) {
      /* istanbul ignore if */
      if (__DEV__ && config.performance && mark) {
        mark('compile')
      }
      // 通过获取到通过模版创建的render函数
      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          outputSourceRange: __DEV__,
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        },
        this
      )
      options.render = render
      log("#FF8F00", "runtime-with-complier.ts method($mount)>var(render):", render)
      options.staticRenderFns = staticRenderFns
      
      /* istanbul ignore if */
      if (__DEV__ && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML(el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue as GlobalAPI
