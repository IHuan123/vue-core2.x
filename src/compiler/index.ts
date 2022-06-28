import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'
import { CompilerOptions, CompiledResult } from 'types/compiler'
import { log } from 'core/util/debug'
// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // parse函数主要解析template为AST树 就是字符串拼接  模版引擎
  const ast = parse(template.trim(), options)
  console.log("通过 parse函数解析出来的AST抽象树",ast)
  log("#CFD8DC","src/compiler/index.ts 通过 parse函数解析出来的AST抽象树var(ast):",ast)
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // 将AST树转为render渲染函数
  const code = generate(ast, options)
  log("#CFD8DC","src/compiler/index.ts methods(createCompilerCreator) 通过ast生成的render代码：",code)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
