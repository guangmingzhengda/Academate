<template>
    <div class="box-container" @mouseenter="hover=true" @mouseleave="hover=false" @click="goToDetail()">

        <div class="msg">

            <div :class="{ titleFont: true }">

                <div style="width: 90%">
                    {{ title_compute }}
                </div>

                <div v-for="item in tagList" class="tagSet">
                    {{item}}
                </div>

            </div>

            <div :class="{ abstractFont: true }" >{{abstract ? abstract.slice(0, 512)+'...' : '...'}}</div>

            <div class="otherMsg">
                <div :class="{ otherMsgFont: true }">{{"author: "
                + (author && author.length > 0) ? author.slice(0, 100)+'...' : '404 not found'}}</div>
                <div :class="{ otherMsgFont: true }">{{postTime}}</div>
            </div>
        </div>

    </div>

</template>

<script>

import {computed, ref} from "vue";
import { useStore } from "vuex";
import {callInfo} from "@/call";
import {getHomePage} from "@/api/home";
import router from "@/router";

export default {
    name: "articleBox",
    props:['title', 'abstract', 'author', 'postTime', 'id', 'tag'],
    setup(props){

        const tagList = ref([])
        tagList.value.push(props.tag)
        const hover = ref(false)

        const title_compute = computed(() =>
            props.title.replace(/[</>]/g, "").slice(0, 200)
        );

        const goToDetail = () => {
            router.push(`/outcome-detail/${props.id}`)
        }

        return {
            tagList,
            hover,
            goToDetail,
            title_compute
        }

    }
}
</script>

<style scoped>
.box-container{
    min-height: 100px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.5s;
    background-color: rgba(255, 255, 255, 0.92);
    border-top: rgba(142, 142, 142, 0.4) 1px solid;
    border-bottom: rgba(142, 142, 142, 0.4) 1px solid;
}

.box-container:hover{
    min-height: 100px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.6);
    transition: background-color 0.5s;
}

.msg{
    display: flex;
    flex-direction: column;
    justify-content: left;
    text-align: left;
    width: 97%;
    height: 96%;
}
.otherMsg{
    display: flex;
    flex-direction: column;
    justify-content: left;
    margin-top: auto;

}
.titleFont {
    font-family: 'Meiryo', sans-serif;
    font-weight: bold;
    font-size: 20px;
    color: #00405f;
    margin-left: 5px;
    text-align: left;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.abstractFont {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    margin-left: 7px;
    color: #646464;
    text-align: left;
    word-wrap: break-word;
}
.otherMsgFont {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    margin-left: 5px;
    color: #8e8e8e;
    text-align: left;
}
.setHr{
    border-top-color: rgba(44, 44, 44, 0.1);
}

.tagSet{
    padding-left: 5px;
    padding-right: 5px;
    margin-left: 3px;
    height: 60%;
    min-width: 0;
    display: flex;
    flex-direction: row;
    background-color: rgba(0, 157, 255, 0.7);
    border-radius: 6px;
    justify-content: center;
    align-items: center;
    cursor: default;
    font-size: 10px;
    color: white;
}

.otherMsgFontDelete {
    font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
    font-size: 10px;
    font-weight: bold;
    color: #ff8e8e;
    margin-left: 10px;
    text-align: left;
}
</style>
