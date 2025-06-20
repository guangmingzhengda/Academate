import {createApp} from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import axios from "axios";
import store from "@/store";
import vClickOutside from "click-outside-vue3"
import * as Icons from '@element-plus/icons-vue'
import vuetyped from 'vue3typed'

axios.defaults.baseURL = '/api' //axios请求默认URL
axios.interceptors.request.use(config => {
    config.headers['token'] = store.getters.getToken; //有效
    config.headers.Authorization = `Bearer ${store.getters.getToken}`; //无效
    //console.log('请求头携带token：'+`${store.getters.getToken}`);
    return config;
}, error => {
    return Promise.reject(error);
}); //请求头token设置

const app = createApp(App);
// app.use(App);
app.use(ElementPlus);
app.use(router)
app.use(store)
app.use(vClickOutside)
app.use(vuetyped)
app.config.globalProperties.$http = axios;
Object.keys(Icons).forEach(key => {
    app.component(key, Icons[key])
})

app.mount('#app');
