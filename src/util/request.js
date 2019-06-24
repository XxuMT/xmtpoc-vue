import axios from 'axios'
import qs from 'qs'
import {getDynamicUrl, cookies, browserUtils} from '@/utils'
import vue from 'vue'

const baseUrl = getDynamicUrl('http://localhost/wapi')
export const request = (url, body, type = 'get', isJson = true, baseUrlRewrite) => {
  const query = {
    url: `${baseUrlRewrite || baseUrl}${url}`,
    method: type,
    withCredentials: true,
    timeout: 60000
  }
  if (type === 'get') {
    query.params = body
  } else {
    query.data = isJson ? body : qs.stringify(body)
    query.headers = {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }

  return axios.request(query)
    .then(res => {
      console.log(res)
      return new Promise((resolve, reject) => {
        if (!res.data) {
          reject(new Error('服务器响应超时'))
          return
        }
        if (res.data.code === 200) {
          resolve(res.data.data)
        } else if (res.data.success === true) {
          // 兼容 按钮权限api 的返回处理
          resolve(res.data.data)
        } else {
          res.data.message = res.data.description
          reject(res.data)
        }
      })
    }, e => {
      console.log(e.response)
      if (e.response.status != null) {
        switch (e.response.status) {
          case 401: // 未登录跳转至登录页
            if (cookies.getCookie('ucarincLogoutUrl')) {
              const ucarincLogoutUrl = cookies.getCookie('ucarincLogoutUrl')
              location.href = ucarincLogoutUrl
              cookies.delCookie('ucarincLogoutUrl')
            } else {
              top.window.postMessage({
                type: 'NO_LOGIN',
                msg: '401'
              }, '*')
              location.assign(getDynamicUrl('http://mmcadmintest.maimaiche.com'))
              if (browserUtils.getBrowser() === 'IE') {
                vue.prototype.$message.error('登录超时，请重新登录')
                setTimeout(() => {
                    location.reload()
                  }, 800
                )
                return
              }
            }
            return Promise.reject(new Error('登录超时，请重新登录'))
          case 403:
            // 无权限操作
            top.window.postMessage({
              type: 'NO_PERMISSION',
              msg: '403'
            }, '*')
            return Promise.reject(new Error('无权访问此资源'))
          default:
            if (e.response.data && e.response.data.description) {
              return Promise.reject(e.response.data.description)
            }
            break
        }
      }
      return Promise.reject(e.response)
    })
    .catch(e => {
      /*
            vue.prototype.$message.error(e && e.message ? e.message : '系统错误')
      */
      // 小信箱定时获取信息错误不提示
      if ((query.url.indexOf('messageNotification/getMes') !== -1 || query.url.indexOf('messageNotification/getMesBoxNum') !== -1)) {
        console.log('小信箱定时获取信息错误不提示')
      } else {
        // vue.prototype.$message.error(e && e.message ? e.message : '请稍后重试')
      }
      return Promise.reject(e)
    })
}
