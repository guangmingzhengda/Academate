<template>
    <div class="title-container"
         @mouseenter="hover = true"
         @mouseleave="hover = false">

        <div class="blog-block">
            <div class="tag-set" style="margin-left: 3px">
                <div :class="{titleFont: !boldSet, titleFontBold: boldSet, titleFontEX: hotSet}">
                    {{rName}}
                </div>
                <div v-if="boldSet" v-for="item in tagList" class="tagSet">
                    {{item}}
                </div>

                <img style="opacity: 0.75" class="img-set" :src="png_url" >

            </div>

            <div style="font-size: 10px; color: #515151; margin-left: 3px">
                {{abstract.replaceAll('#', '')+"......"}}
            </div>

            <div v-if="boldSet" style="font-size: 8px; color: #8e8e8e">
                作者：{{author}} | 发布时间：{{createTime}}
            </div>

            <div v-if="hotSet" style="font-size: 8px; color: #8e8e8e">
                {{profile}}
            </div>

        </div>

        <img class="img-set" :src="require('@/asset/home/fishing.png')" >
    </div>
</template>

<script>

import {ref} from "vue";

export default {
    name: "recommendButton",
    props: ['rName', 'boldSet', 'abstract', 'tagList', 'author', 'createTime', 'hotSet', 'userId'],
    data(){
        return{
            hover: false,
            profile: '博主没有留下个人简介......',
        }
    },
    setup(props){
        const u = ref("")
        if (props.rName.length < 4) {
            u.value += "cursed-star.png"
        } else if (props.rName.length < 8){
            u.value += "beveled-star.png"
        }else if (props.rName.length < 12){
            u.value += "star-swirl.png"
        }else if (props.rName.length < 16){
            u.value += "night-sky.png"
        }else{
            u.value += "polar-star.png"
        }
        const png_url = require("@/asset/home/"+u.value)
        return{
            png_url
        }
    }
}
</script>

<style scoped>
.tagSet{
    padding-left: 2px;
    padding-right: 2px;
    margin-left: 2px;
    height: 60%;
    min-width: 0;
    display: flex;
    flex-direction: row;
    background-color: #def2ff;
    border-radius: 3px;
    justify-content: center;
    align-items: center;
    cursor: default;
    font-size: 8px;
}
.tag-set{
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
}
.blog-block{
    display: flex;
    flex-direction: column;
    text-align: left;
    min-height: 40px;
}
.titleFontEX {
    font-family: 'meriyo', sans-serif;
    font-size: 13px;
    text-align: left;
    font-weight: bold;
    color: #383838;
}
.titleFont {
    font-family: 'meriyo', sans-serif;
    font-size: 16px;
    text-align: left;
    font-weight: bold;
}
.titleFontBold {
    font-family: 'meriyo', sans-serif;
    font-size: 12px;
    text-align: left;
    font-weight: bold;
    color: #353535;
}
.moreFont{
    font-family: 'meriyo', sans-serif;
    font-size: 16px;
    text-align: center;
    color: rgba(55, 55, 55, 0.4);
}
.title-container{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    /*padding: 8px;*/
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0);
    transition: background-color 0.5s ease;
    min-height: 50px;
}
.title-container:hover{
    background-color: rgba(0, 158, 255, 0.3);
}
.img-set{
    margin-left: 6px;
    width: 17px;
    height: 17px;
}
</style>
