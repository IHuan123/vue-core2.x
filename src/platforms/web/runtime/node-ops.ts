// 封装创建真实dom的方法
import VNode from 'core/vdom/vnode'
import { namespaceMap } from 'web/util/index'
// 创建一个元素
export function createElement(tagName: string, vnode: VNode): Element {
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  // false 或 null 将删除该属性，但 undefined 不会
  if (
    vnode.data &&
    vnode.data.attrs &&
    vnode.data.attrs.multiple !== undefined
  ) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}
// 创建一个具有命名空间的标签，如XHTML类的svg标签等
export function createElementNS(namespace: string, tagName: string): Element {
  return document.createElementNS(namespaceMap[namespace], tagName)
}
//创建一个文本节点
export function createTextNode(text: string): Text {
  return document.createTextNode(text)
}
// 创建一个注释
export function createComment(text: string): Comment {
  return document.createComment(text)
}
// 在referenceNode前面插入newNode
export function insertBefore(
  parentNode: Node,
  newNode: Node,
  referenceNode: Node
) {
  parentNode.insertBefore(newNode, referenceNode)
}
// 删除子元素
export function removeChild(node: Node, child: Node) {
  node.removeChild(child)
}
// 添加子元素
export function appendChild(node: Node, child: Node) {
  node.appendChild(child)
}
// 获取父元素
export function parentNode(node: Node) {
  return node.parentNode
}
// 获取下一个兄弟元素
export function nextSibling(node: Node) {
  return node.nextSibling
}
// 获取元素标签
export function tagName(node: Element): string {
  return node.tagName
}
// 设置元素文本内容
export function setTextContent(node: Node, text: string) {
  node.textContent = text
}
// 清空元素属性
export function setStyleScope(node: Element, scopeId: string) {
  node.setAttribute(scopeId, '')
}
