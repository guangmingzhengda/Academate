import { createStore } from 'vuex';
import axios from "axios";
import router from "@/router";
import VuexPersistence from "vuex-persist";
import {callSuccess, callError, callInfo, callWarning} from "@/call";
import websocketManager from "@/utils/websocketManager";
import { listConversations } from '@/api/chat'

//状态管理

//本地cookie存储
const vuexLocal = new VuexPersistence({
    storage: window.localStorage
});

export default createStore({


    state: { //存储内容
        token: null,
        //设置登录过期
        tokenExpire: null,
        id: null,
        name: null,

        nickname: null,
        avatar: null,
        profile: null,
        role: "user",
        email: null,
        isAdmin:true,
        isTA: null,
        tempTitle: '',
        tempContent: '',
        eventList: [],

        userMap: new Map(),
        blogMap: new Map(),
        commentMap: new Map(),
        replyMap: new Map(),
        courseMap: new Map(),
        classMap: new Map(),

        navOpen: false,

        vipSet: false,
        chatUnreadCount: 0, // 新增：未读聊天消息数
        
        // 推荐内容缓存
        recommendationList: [],
        recommendationTimestamp: null,
        recommendationCacheExpiration: 20 * 60 * 1000 // 20分钟缓存时间

    },


    getters:{
        // 查看是否可以使用增值服务
        getVipState(state){
            return state.vipSet;
        },
        //获取文章暂存信息
        getContent(state){
            return{
                title: state.tempTitle,
                content: state.tempContent
            }
        },
        //获取用户个人信息
        getData(state){
            return {
                id: state.id,
                name: state.name,
                nickname: state.nickname,
                avatar: state.avatar,
                profile: state.profile,
                role: state.role,
                email: state.email,
                isTA: state.isTA,
            }
        },
        getIsAdmin(state){
            //登出之后状态没清除
            // console.log("看看当前state的role是什么"+state.role);
            if(state.role!="admin"||state.role==null)
            {
                return false;
            }
            return true;
        },
        //获取登录认证令牌
        getToken(state){
            // console.log('当前时间：'+Date.now());
            // console.log('token过期时间：'+state.tokenExpire);
            if (Date.now() > state.tokenExpire){

                state.token = null;
                state.role = "user";
                state.id = null;
                state.name = null;
                state.nickname = null;
                state.avatar = null;
                state.profile = null;

                state.eventList = [];

                state.userMap = new Map();
                state.blogMap = new Map();
                state.commentMap = new Map();
                state.replyMap = new Map();

                //console.log('token已经过期');
            }
            return state.token;
        },
        //获取动态信息
        getEventList(state){
            return state.eventList;
        },

        getMapUser: (state) => (userId) => {
            return state.userMap[userId];
        },

        getMapBlog : (state) => (blogId) =>{
            return state.blogMap[blogId];
        },

        getMapComment: (state)=> (commentId) => {
            return state.commentMap[commentId];
        },

        getMapReply: (state)=> (replyId)=>{
            return state.replyMap[replyId];
        },

        getEduIdentity(state) {
            return state.role;
        },

        getEduIsTA(state) {
            return state.isTA;
        },

        getId(state) {
            return state.id;
        },

        getMapCourse: (state) => (courseId) => {
            return state.courseMap[courseId];
        },

        getMapClass: (state) => (classId) => {
            return state.classMap[classId];
        },

        getNavStat(state) {
            return state.navOpen;
        },

        getChatUnreadCount(state) {
            return state.chatUnreadCount
        },

        // 获取推荐数据
        getRecommendationList(state) {
            return state.recommendationList;
        },

        // 检查推荐数据缓存是否过期
        isRecommendationCacheExpired(state) {
            if (!state.recommendationTimestamp) {
                return true;
            }
            const now = Date.now();
            return (now - state.recommendationTimestamp) > state.recommendationCacheExpiration;
        },

    },


    mutations: {

        setVipState(state, stat){
            state.vipSet = stat;
            // callInfo("已设置VIP状态为："+stat);
        },

        setNavStat(state, stat){
            state.navOpen = stat;
        },

        //如果想要去除token，执行以下代码，commit('setToken', null);
        setToken(state, token) {
            // console.log(token);
            state.token = token;
            state.tokenExpire = Date.now() + 3600 * 1000;
            //state.tokenExpire = Date.now() + 3600 * 1000;
        },

        //设置个人信息
        setData(state, data){
            state.id = data.id;
            state.name = data.name;
            state.nickname = data.nickname;
            state.avatar = data.avatar;
            state.profile = data.profile;
            state.role = data.role;
            state.email = data.email;
            state.isTA = data.isTA;
            state.vipSet = data.isVip;
            // console.log("vipvip: "+data.isVip);
            state.eduIdentity = 'teacher';

            state.userMap = new Map();
            state.blogMap = new Map();
            state.commentMap = new Map();
            state.replyMap = new Map();
        },

        //设置文章暂存
        setContent(state, content){
            state.tempContent = content.content;
            state.tempTitle = content.title;
        },

        //存放私信
        addEvent(state, newEvent)
        {
            state.eventList.push(newEvent);
        },

        //清空事件
        clearEvent(state){
            state.eventList = [];
        },

        addMapUser(state, data){
            const userId = data.userId;
            const userData = data.userData;
            //console.log('尝试缓存user:'+userId);
            state.userMap[userId] = userData;
            //console.log(state.userMap);
            //state.userMap.set(userId, userData);
        },

        addMapBlog(state, data){
            const blogId = data.blogId;
            const blogData = data.blogData;
            state.blogMap[blogId] = blogData;
            //state.blogMap.set(blogId, blogData);
        },

        addMapComment(state, data){
            const commentId = data.commentId;
            const commentData = data.commentData;
            state.commentMap[commentId] = commentData;
            //state.commentMap.set(commentId, commentData);
        },

        addMapReply(state, data){
            const replyId = data.replyId;
            const replyData = data.replyData;
            state.replyMap[replyId] = replyData;
            //state.replyMap.set(replyId, replyData);
        },

        addMapCourse(state, data){
            const courseId = data.courseId;
            const courseData = data.result;
            //console.log('尝试缓存course:'+courseId);
            state.courseMap[courseId] = courseData;
            //console.log(state.userMap);
            //state.courseMap.set(courseId, courseData);
        },

        addMapClass(state, data){
            const classId = data.classId;
            const classData = data.result;
            //console.log('尝试缓存class:'+classId);
            state.courseMap[classId] = classData;
            //console.log(state.userMap);
            //state.courseMap.set(courseId, courseData);
        },

        setChatUnreadCount(state, count) {
            state.chatUnreadCount = count
        },

        // 设置推荐数据和时间戳
        setRecommendationList(state, data) {
            state.recommendationList = data;
            state.recommendationTimestamp = Date.now();
        },

        // 清空推荐数据缓存
        clearRecommendationCache(state) {
            state.recommendationList = [];
            state.recommendationTimestamp = null;
        },

    },


    actions: {

        //用户名登录
        async login( { commit, state }, credentials) {
            try {
                const response = await axios.post('/user/login', credentials);
                // console.log(response.data);
                if (response.status === 200){
                    if (response.data.code == 0){
                        commit('setToken', response.data.data.token);
                        commit('setData', response.data.data);
                        
                        // 登录成功后连接WebSocket
                        console.log('登录成功，连接WebSocket')
                        websocketManager.connect()
                        // 登录成功后拉取会话列表并计算未读聊天消息数
                        const conversationList = await listConversations()
                        let unread = 0
                        if (conversationList && conversationList.length > 0) {
                            unread = conversationList.reduce((total, conv) => total + (conv.unreadMessageCount || 0), 0)
                        }
                        commit('setChatUnreadCount', unread)
                        callSuccess('登录成功');
                        setTimeout(()=>{
                            router.push('/home');
                        }, 1000);
                    }
                    else callError(response.data.message);
                }
                else callError('网络错误');
            }
            catch (error) {
                //console.log('there are some errors in login');
                callError('密码错误或用户不存在');
            }
            return 1;
        },

        //邮箱登录
        async eLogin({commit, state}, credentials) {
            try {
                // 根据API文档构造请求体
                const requestData = {
                    email: credentials.userEmail,
                    userPassword: credentials.userPassword
                };
                
                console.log('邮箱登录请求数据:', requestData);
                
                const response = await axios.post('/user/login/email', requestData);
                console.log('邮箱登录响应:', response.data);
                
                if (response.status === 200){
                    if (response.data.code == 0){
                        // 根据API文档，响应数据包含id, account, avatar, profile, institution, role, email, token
                        const userData = {
                            id: response.data.data.id,
                            name: response.data.data.account, // 映射account到name
                            nickname: response.data.data.account, // 使用account作为nickname
                            avatar: response.data.data.avatar,
                            profile: response.data.data.profile,
                            role: response.data.data.role,
                            email: response.data.data.email,
                            isTA: null,
                            isVip: false // 默认非VIP，后续可从其他接口获取
                        };
                        
                        commit('setToken', response.data.data.token);
                        commit('setData', userData);
                        
                        // 登录成功后连接WebSocket
                        console.log('邮箱登录成功，连接WebSocket')
                        websocketManager.connect()
                        // 登录成功后拉取会话列表并计算未读聊天消息数
                        const conversationList = await listConversations()
                        let unread = 0
                        if (conversationList && conversationList.length > 0) {
                            unread = conversationList.reduce((total, conv) => total + (conv.unreadMessageCount || 0), 0)
                        }
                        commit('setChatUnreadCount', unread)
                        callSuccess('邮箱登录成功');
                        setTimeout(()=>{
                            router.push('/home');
                        }, 1000);
                    }else {
                        callError(response.data.message || '登录失败');
                    }
                }
                else {
                    callError('网络错误');
                }
            } catch (error) {
                console.error('邮箱登录错误:', error);
                if (error.response) {
                    // 服务器返回了错误响应
                    callError(error.response.data?.message || '登录失败');
                } else if (error.request) {
                    // 请求发送了但没有收到响应
                    callError('网络连接错误');
                } else {
                    // 其他错误
                    callError('登录失败，请重试');
                }
            }
        },

        //登出，清除token
        logout({ commit }) {
            try {
                // 登出前断开WebSocket连接
                console.log('用户登出，断开WebSocket连接')
                websocketManager.disconnect()
                
                callSuccess('账号退出成功');
                commit('setToken', null);
                const credient={
                    id: null,
                    name: null,
                    nickname: null,
                    avatar: null,
                    profile: null,
                    role: "user",
                    email: null,
                    isTA: null,
                    eduIdentity: null,
                }
                commit('setData',credient);
                router.push('/');
            } catch (error) {
                //console.log('there are some errors in logout');
            }
        },

        // 获取推荐数据（带缓存逻辑）
        async fetchRecommendations({ commit, getters, state }) {
            try {
                // 检查缓存是否过期
                if (!getters.isRecommendationCacheExpired && state.recommendationList.length > 0) {
                    console.log('使用缓存的推荐数据');
                    return state.recommendationList;
                }

                console.log('缓存已过期或为空，重新获取推荐数据');

                // 从API获取新数据
                const response = await axios.get('/recommendation/popular', {
                    params: {
                        pageSize: 8,
                        pageNum: 1
                    }
                });

                if (response.status === 200 && response.data.code === 0) {
                    const recommendationData = response.data.data.list || [];
                    
                    // 存储到 Vuex
                    commit('setRecommendationList', recommendationData);
                    
                    console.log(`成功获取并缓存 ${recommendationData.length} 条推荐数据`);
                    return recommendationData;
                } else {
                    console.error('获取推荐数据失败:', response.data.message);
                    return [];
                }
            } catch (error) {
                console.error('获取推荐数据错误:', error);
                // 如果有缓存数据，即使过期也返回缓存数据作为降级方案
                if (state.recommendationList.length > 0) {
                    console.log('API请求失败，使用过期缓存数据作为降级方案');
                    return state.recommendationList;
                }
                return [];
            }
        },

        // 清空推荐数据缓存
        clearRecommendationCache({ commit }) {
            commit('clearRecommendationCache');
        },


    },

    //本地存储插件
    plugins: [vuexLocal.plugin]
});
