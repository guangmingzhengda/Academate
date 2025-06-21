<template>
    <div class="bg-container"/>

    <div class="view-set-margin">
        <div class="content-container">

            <div class="content-left">

                <fade-box style="margin-bottom: 25px">
                    <logo/>
                </fade-box>

<!--                <fade-box>-->
                <left-pin r-title="recommend"/>
<!--                </fade-box>-->

            </div>

            <div class="content-right">

                <fade-box>
                    <div style="width: 100%; display: flex; flex-direction: row;
                    justify-content: left; align-items: center">
                        <el-select
                            v-model="sel_value"
                            placeholder="Select"
                            size="large"
                            style="width: 120px"
                        >
                            <el-option
                                v-for="item in options"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>

                        <div style="margin-left: 10px;
                            font-family: 'Meiryo', sans-serif;
                            font-weight: bold; color: black; font-size: 24px;">
                            Connect using Academate!
                        </div>

                        <img style="width: 28px; height: 28px; margin-left: 10px"
                             src="@/asset/home/star-swirl-white.png" >

                    </div>
                </fade-box>

                <fade-box>
                    <article-box v-for="item in articleList" :abstract="item.abstract"
                    :title="item.title" :post-time="item.postTime"
                    :author="item.author" :tag="item.type" :id="item.id"/>
                </fade-box>

                <el-pagination class="pagination-style"
                               v-model:current-page="currentPos"
                               ref="bottomPagination"
                               layout="prev, pager, next"
                               @current-change="pageChange()"
                               :total="10*totalPage"
                               background
                />

            </div>
        </div>

        <home-bottom/>
    </div>



<!--    <el-backtop :left="50" :bottom="50" />-->

</template>


<script>

import Search_title from "@/page/home/component/search_title/index.vue";
import {onMounted, onUnmounted, reactive, ref, watch} from "vue";
import articleBox from "@/page/home/component/articleBox/index.vue";
import fadeBox from "@/page/home/component/fadeBox/index.vue";
import logo from "@/page/home/component/logo/index.vue"
import homeBottom from "@/page/home/component/homeBottom/index.vue"
import leftPin from "@/page/home/component/leftPin/index.vue";
import homeMsg from "@/page/home/component/homeMsg/index.vue";
import {setNav} from "@/nav/set";
import {getHomePage, getRecommend, getTotalAuthor, getTotalPaper, obj} from "@/api/home";
import TestAI from "@/page/achievement-detail/testAI/index.vue";


export default {
    name: "home",
    components: {TestAI, Search_title, articleBox, fadeBox, logo, homeBottom, leftPin, homeMsg},
    setup(){

        const currentPos = ref(1);

        const totalPage = ref(10);

        const step = ref(true);
        const notHead = ref(false);
        const articleList = ref([]);
        const tagHint = ref("学术论文")

        const totalPaper = ref(0);
        const totalAuthor = ref(0);

        //滑动响应式组件
        const data = reactive({
            oldScrollTop:0,
        });

        const scrolling = ()=> {
            // 滚动条距文档顶部的距离
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            // 滚动条滚动的距离
            let scrollStep = scrollTop - data.oldScrollTop;
            //console.log("header 滚动距离 ", scrollTop);
            // 更新——滚动前，滚动条距文档顶部的距离
            data.oldScrollTop = scrollTop;
            //变量windowHeight是可视区的高度
            let windowHeight =
                document.documentElement.clientHeight || document.body.clientHeight;
            //变量scrollHeight是滚动条的总高度
            let scrollHeight =
                document.documentElement.scrollHeight || document.body.scrollHeight;
            //滚动条到底部的条件
            if (scrollTop + windowHeight === scrollHeight) {
                //到达底部
            }

            if (scrollStep < 0) {
                //向上滚动
                step.value = true;
                //setNav(true);
            } else {
                //向下滚动
                step.value = false;
                if (!notHead.value) {
                    notHead.value = true;
                    //setNav(true);
                }else {
                    //setNav(false);
                }
            }
            // 判断是否到了最顶部
            if (scrollTop <= 0) {
                notHead.value = false;
                //setNav(false);
            }

        }

        const sel_value = ref(0);
        const options = [
            {
                value: 0,
                label: '学术论文',
            },
            {
                value: 1,
                label: '专利',
            },
            {
                value: 2,
                label: '科研项目',
            },
            {
                value: 3,
                label: '奖项',
            },
        ]

        const pageChange = async() => {
            try {
                // console.log('pageChange: ')

                if (currentPos.value >= 1000){
                    articleList.value = await getHomePage(
                        (19 * currentPos.value)%1000 + 1,
                        sel_value.value
                    );
                }else{
                    articleList.value = await getHomePage(
                        currentPos.value,
                        sel_value.value
                    );
                }

                if (sel_value.value === 0){
                    totalPage.value = Math.ceil(  7 * articleList.value[0].total / 10);
                }else{
                    totalPage.value = Math.ceil(  articleList.value[0].total / 10);
                }

                // console.log('update: ')
                // console.log(articleList.value)
            } catch (error) {}
        }

        watch(sel_value, async(newValue, oldValue) => {
            currentPos.value = 1;
            tagHint.value = options[newValue].label;
            articleList.value = []
            await pageChange();
        });

        onMounted(async () => {
            // 添加滚动事件监听
            //window.addEventListener("scroll", scrolling);
            // 设置导航状态
            //setNav(false);
            try {

                totalPaper.value = await getTotalPaper();
                totalAuthor.value = await getTotalAuthor();

                // 等待异步函数返回数据
                const result = await getHomePage(currentPos.value, sel_value.value);

                // 将结果赋值给 articleList
                articleList.value = result;

                if (sel_value.value === 0){
                    totalPage.value = Math.ceil( 7 * articleList.value[0].total / 10);
                }else{
                    totalPage.value = Math.ceil( articleList.value[0].total / 10);
                }

                // await getRecommend();

            } catch (error) {}
        });

        onUnmounted(() => {
            window.removeEventListener("scroll", scrolling);
        })

        return {
            sel_value,
            options,
            notHead,
            articleList,
            currentPos,
            totalPage,
            pageChange,
            tagHint,
            totalPaper,
            totalAuthor
        };

    }
}
</script>

<style scoped>

.content-container{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 1200px;
    height: auto;
}

.bg-container {
    background: url('@/asset/home/homehead.png');
    /*opacity: 0.8;*/
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -3;
    top: 0;
    left: 0;
}

.root-set{
    height: 100vh;
    width: 100%;
    /*display: flex;*/
    transition: height 0.8s;
    position: relative;
}

.root-set-change{
    height: 0;
    width: 100%;
    /*display: flex;*/
    transition: height 0.8s;
}

.msg-set{
    transition: opacity 0.3s;
}

.msg-set-change{
    opacity: 0;
    transition: opacity 0.3s;
    z-index: -2;
}

.bar-set{
    margin: auto;
    /*width: 100%;*/
    transition: opacity 0.6s;
}

.bar-set-change{
    margin: auto;
    opacity: 0;
    transition: opacity 0.6s;
    z-index: -2;
}

.content-right{
    width: 70%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.content-left{
    width: 28%;
    min-height: 1000px;
}

.view-set-margin{
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
}
.pagination-style{
    justify-content: center;
}

.layer-set{
    z-index: 1;
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex
}

.layer-set-change{
    z-index: -2;
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex
}

.zind{
    z-index: -2;
}

.zind2{
    z-index: 2;
}

ai-op1{
    opacity: 1 !important;
}

ai-op0{
    opacity: 0 !important;
}

</style>
