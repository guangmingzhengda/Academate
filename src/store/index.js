import { createStore } from 'vuex';
import axios from "axios";
import router from "@/router";
import VuexPersistence from "vuex-persist";
import {callSuccess, callError, callInfo, callWarning} from "@/call";

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

        vipSet: false

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
        }

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
                        callSuccess('登录成功');
                        setTimeout(()=>{
                            router.push(`/profile/${response.data.data.id}`);
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
                const response = await axios.post('/user/emailLogin', credentials);
                if (response.status === 200){
                    if (response.data.code == 0){
                        commit('setToken', response.data.data.token);
                        commit('setData', response.data.data);
                        callSuccess('登录成功');
                        setTimeout(()=>{
                            router.push(`/profile/${response.data.data.id}`);
                        }, 1000);
                    }else callError(response.data.message);
                }
                else callError('网络错误');
            } catch (error) {
                //console.log('there are some errors in login');
                callError('密码错误或用户不存在');
            }
        },

        //登出，清除token
        logout({ commit }) {
            try {
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


    },

    //本地存储插件
    plugins: [vuexLocal.plugin]
});
