import {request} from '@/util/request'


/**
 * 登陆API
 **/

export const loginRequest = {
  login: (body) => request('/login', body, 'post')
}
