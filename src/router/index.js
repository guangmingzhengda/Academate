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
        
        {
            path: '/problem-detail/:id?',
            name: 'problem-detail',
            component: defineAsyncComponent(() => import(`../page/problem-detail/index.vue`)),
            meta: {
                title: '问题详情',
            },
        },

        {
            path: '/outcome-detail/:id?',
            name: 'outcome-detail',
            component: defineAsyncComponent(() => import(`../page/outcome-detail/index.vue`)),
            meta: {
                title: '学术成果详情',
            },
        },

        // 用户个人资料
        {
            path: '/profile/:id?',
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
            redirect: '/login',
        },
        
        {
            path: '/',
            redirect: '/login',
        }

    ]
})

router.beforeEach((to, from, next)=>{

    const hasToken = store.getters.getToken;
    console.log(`路由守卫: ${from.path} → ${to.path}, hasToken: ${hasToken != null}`);

    if (hasToken != null){
        // 用户已登录
        if (to.path === '/login') {
            // 已经登录了，去首页
            console.log('用户已登录，从登录页重定向到首页');
            setNav(true); // 确保导航栏显示
            next({ path: '/home' })
        }else{
            // 访问其他页面，显示导航栏
            console.log('用户已登录，显示导航栏');
            setNav(true);
            if (to.meta.title) {
                document.title = `${to.meta.title}`;
            }
            next();
        }

    }else{
        // 用户未登录
        if (to.path === '/login'){
            // 访问登录页面，隐藏导航栏
            console.log('访问登录页面，隐藏导航栏');
            setNav(false);
            next();
        }else{
            // 访问其他页面，重定向到登录页面并隐藏导航栏
            console.log('用户未登录，重定向到登录页面并隐藏导航栏');
            setNav(false);
            window.alert('您辛苦了，请先登录吧');
            next('/login');
        }
    }

})

router.afterEach((to, from)=>{
    // 路由切换成功后，再次确保导航栏状态正确
    const hasToken = store.getters.getToken;
    
    if (to.path === '/login') {
        // 确保登录页面隐藏导航栏
        console.log('路由切换完成：登录页面，强制隐藏导航栏');
        setNav(false);
    } else if (hasToken != null) {
        // 确保已登录用户在其他页面显示导航栏
        console.log('路由切换完成：其他页面，已登录用户显示导航栏');
        setNav(true);
    }
    
    console.log('路由切换成功', 'path:', to.path, 'hasToken:', hasToken != null, 'navOpen:', store.getters.getNavStat)
})

export default router
