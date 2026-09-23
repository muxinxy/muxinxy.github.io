/**
 * 补齐 Keep 主题 Waline 评论插件漏掉的初始化调用。
 *
 * 主题在 waline.version 为 3.x 时走 ESM 分支，把初始化挂在 DOMContentLoaded 上，
 * 但那个 <script> 带 async，要从 CDN 拉一百多 KB 的 waline.js，通常等它执行时
 * DOMContentLoaded 早已触发，回调再也不会被调用 —— 评论区就一直停在“正在加载评论插件”。
 * 该分支也没有 onerror，所以失败时同样只有转圈。
 *
 * 这里在页面 load 之后检查一次：若插件仍未初始化且转圈还显示着，就补调一次。
 * 只在转圈仍可见时调用，所以不会和主题自己的回调重复初始化。
 * 上游修复后本文件即可删除（连同 keep.yml 里的 inject 配置）。
 */
;(function () {
  var LOADING_SELECTOR = '.comments-container .comment-plugin-loading'

  function ensureWalineInit() {
    var plugin = window.KeepCommentPlugin
    if (!plugin || typeof plugin.initWaline !== 'function') {
      return false // 模块还没执行，稍后再试
    }

    var loading = document.querySelector(LOADING_SELECTOR)
    if (!loading) {
      return true // 本页没有评论区
    }
    if (getComputedStyle(loading).display === 'none') {
      return true // 主题自己的回调已经初始化过了
    }

    plugin.initWaline()
    return true
  }

  window.addEventListener('load', function () {
    if (ensureWalineInit()) {
      return
    }

    var tries = 0
    var timer = setInterval(function () {
      if (ensureWalineInit() || ++tries > 40) {
        clearInterval(timer) // 最多等 10 秒
      }
    }, 250)
  })
})()
