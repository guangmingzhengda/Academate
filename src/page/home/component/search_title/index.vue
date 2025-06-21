<template>
    <div style="display: flex; flex-direction: column;">

        <vuetyped :class="{'title-font': !cond, 'change-font': cond}"
                  :key="title_str.join('')"
                  :strings="title_str" :type-speed="50" :show-cursor="false">
            <div class="typing"/>
        </vuetyped>

        <search_bar :type="search_select" :cond="cond" style="margin-left: auto; margin-right: auto; margin-top: 25px;"/>

        <!-- <div class="mb-2 ml-4" style="margin-top: 15px">
            <el-radio-group v-model="search_select">
                <el-radio value="0" size="large" class="select-font">学术论文</el-radio>
                <el-radio value="1" size="large" class="select-font">专利</el-radio>
                <el-radio value="2" size="large" class="select-font">科研项目</el-radio>
                <el-radio value="3" size="large" class="select-font">奖项</el-radio>
            </el-radio-group>
        </div>  -->

    </div>
</template>

<script lang="ts">

import Search_bar from "@/page/home/component/search_bar/index.vue";
import {ref, watch} from "vue";

export default {
    name: "search_title",
    components: {Search_bar},
    props: {
        'cond' : Boolean
    },
    setup(props){

        const search_select = ref('0')

        const title_str = ref(['ACADEMATE']);

        watch(
            () => props.cond,
            (newCond, oldCond) => {
                if (newCond !== oldCond) {
                    setTimeout(() => {
                        title_str.value = [''];
                    }, 10);
                    setTimeout(() => {
                        title_str.value = ['ACADEMATE'];
                    }, 400);
                }
            }
        );

        return {
            title_str,
            search_select
        };
    }
}

</script>

<style scoped>
.title-font {
    font-family: 'Meiryo', sans-serif;
    font-weight: bold;
    font-size: 70px;
    transition: font-size 0.6s;
    color: rgba(255, 255, 255);
    text-shadow:
        0.5px 0.5px 0 #000,
        -0.5px -0.5px 0 #000,
        0.5px -0.5px 0 #000,
        -0.5px 0.5px 0 #000;
    margin: auto;
}

.change-font {
    font-family: 'Meiryo', sans-serif;
    font-weight: bold;
    font-size: 30px;
    transition: font-size 0.2s;
    color: rgba(255, 255, 255);
    text-shadow:
        0.5px 0.5px 0 #000,
        -0.5px -0.5px 0 #000,
        0.5px -0.5px 0 #000,
        -0.5px 0.5px 0 #000;
    margin: auto;
}

.select-font {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: bold;
    text-shadow:
        0.5px 0.5px 0 rgba(0, 0, 0, 0.6),   /* 右下 */
        -0.5px -0.5px 0 rgba(0, 0, 0, 0.6), /* 左上 */
        0.5px -0.5px 0 rgba(0, 0, 0, 0.6),  /* 右上 */
        -0.5px 0.5px 0 rgba(0, 0, 0, 0.6);  /* 左下 */
}

::v-deep .el-radio.is-checked .el-radio__label {
    color: #9fe6ff !important;
}

/* 修改选中时圆圈的颜色 */
::v-deep .el-radio.is-checked .el-radio__inner {
    border-color: #d1fff9 !important;
    background-color: #369fff !important;
}

</style>
