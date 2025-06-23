import { createRouter,createWebHashHistory, createWebHistory } from "vue-router";
import {computed, defineAsyncComponent} from 'vue'
import store from "@/store";
import {callSuccess, callError, callInfo, callWarning} from "@/call";
import {setNav} from "@/nav/set";
import {decode_function} from "@/decode/code";
//路由设置

const router = createRouter({
    //history: createWebHashHistory(process.env.BASE_URL),  // hash 模式
    history: createWebHistory(),  // history 模式
    routes: [

        {
            path:'/login',
            name:'login',
            component: defineAsyncComponent(() => import(`../page/login/index.vue`)),
            meta: {
                title: '登录'
            }
        },

        //学术平台首页
        {
            path: '/home',
            name: 'home',
            component: defineAsyncComponent(() => import(`../page/home/index.vue`)),

            meta: {
                title: 'Welcome to ACADEMATE',
            },
        },

        //专家知识网络
        {
            path: '/graph',
            name: 'graph',
            component: defineAsyncComponent(() => import(`../page/graph/index.vue`)),
        },

        // 空白页
        {
            path: '/blank',
            name: 'blank',
            component: defineAsyncComponent(() => import(`../page/blank/index.vue`)),
        },

        // 学术成果详情
        {
            path: '/achievement-detail/:id?',
            name: 'achievement-detail',
            component: defineAsyncComponent(() => import(`../page/achievement-detail/index.vue`)),
            meta: {
                title: '学术成果详情',
            },
        },

        {
            path: '/project-detail/:id?',
            name: 'project-detail',
            component: defineAsyncComponent(() => import(`../page/project-detail/index.vue`)),
            meta: {
                title: '项目详情',
            },
        },

        // 用户个人资料
        {
            path: '/profile',
            name: 'profile',
            component: defineAsyncComponent(() => import(`../page/profile/index.vue`)),
            meta: {
                title: '个人资料',
            },
        },

        // 科研人员检索
        {
            path: '/researcher-search',
            name: 'researcher-search',
            component: defineAsyncComponent(() => import(`../page/researcher-search/index.vue`)),
            meta: {
                title: '科研人员检索',
            },
        },

        // 提问大厅
        {
            path: '/question-hall',
            name: 'question-hall',
            component: defineAsyncComponent(() => import(`../page/question-hall/index.vue`)),
            meta: {
                title: '提问大厅',
            },
        },

        {
            path: '/:catchAll(.*)',
            redirect: '/researcher-search',
        },
        {
            path: '/',
            redirect: '/home',
        }

    ]
})

// 一定需要 token 的路由
const protect_router = [
    '/favourite',
    '/administrator',
    '/auth'
];

router.beforeEach((to, from, next)=>{

    if (to.path !== '/login')  setNav(true); // 开导航条
    else setNav(false); // 关导航条

    if (to.name === 'achievement-detail' && to.params.id){
        // 矩阵乘法
        let achievementId = to.params.id;
        if (!achievementId.includes('-')) {
            // window.alert('原id: '+achievementId);
            // 未加密路由
            let X = [];

            for (let i=0;i<7-achievementId.length;i++){
                X.push(0);
            }
            for (let i=0; i<achievementId.length;i++){
                X.push(Number(achievementId[i]));
            }

            achievementId = '';

            achievementId += (2*X[0]+1*X[1]).toString() + '-';
            achievementId += (       2*X[1]).toString() + '-';
            achievementId += (              1*X[2]).toString() + '-';
            achievementId += (                     7*X[3]+1*X[4]).toString() + '-';
            achievementId += (                            7*X[4]).toString() + '-';
            achievementId += (                            2*X[5]+1*X[6]).toString() + '-';
            achievementId += (                                   2*X[6]).toString();

            let newId = ''

            for (let i=0; i<achievementId.length;i++){
                const isDigit = (char) => char.length === 1 && char >= '0' && char <= '9';
                if (isDigit(achievementId[i])){
                    const asciiToChar = (ascii) => String.fromCharCode(ascii);
                    newId += asciiToChar(Number(achievementId[i]) + 65);
                }else newId += '-';
            }

            // window.alert('解码后id: '+decode_function(newId));

            // 重定向到新的路由
            next({
                name: 'achievement-detail',
                params: { id: newId },
            });
            return; // 必须 return，避免重复调用 next()
        }
    }

    const hasToken = store.getters.getToken;

    next();

    // if (hasToken != null){

    //     if (to.path === '/login') {
    //         //已经登录了，去首页
    //         next({ path: '/home' })
    //     }else{
    //         if (to.meta.title) {
    //             document.title = `${to.meta.title}`;
    //         }
    //         //直接放行
    //         next();
    //     }

    // }else{
    //     //没有登录

    //     if (!protect_router.includes(to.path)){
    //         // 不需要 token 的路由，直接放行
    //         next();
    //     }else{
    //         window.alert('您辛苦了，请先登录吧');
    //         // 没有登录，去登录页面
    //         next('/login');
    //     }
    // }

})

router.afterEach((to, from)=>{
    //切换路由成功
    //console.log('change page succeed')
})

export default router
