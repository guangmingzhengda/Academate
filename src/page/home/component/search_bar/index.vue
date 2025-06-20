<template>
    <el-input
            v-model="searchInput"
            placeholder=" Search...... "
            clearable :class="{'el-input-style': true}"
            @mouseenter="hover=true"
            @mouseleave="hover=false"
            @keydown.enter="callSearchPage()"
    >
        <template #suffix>
            <div class="circular-icon-container">
                <img class="icon-search" style="width: 1em; height: 1em"
                     src="@/asset/home/magnifying-glass.png" alt="Search" @click="callSearchPage"/>
            </div>
        </template>
    </el-input>
</template>

<script>
import {callInfo} from "@/call";
import router from "@/router"

export default {
    name: "search_bar",
    props: {
      'cond' : Boolean | undefined, 'type': String | undefined
    },
    data(){
        return{
            searchInput:  "",
            hover: false
        }
    },
    methods:{
        callSearchPage(){
            if (this.searchInput.length > 100){
                callInfo('搜索内容过长');
                return;
            }
            if (this.searchInput.length === 0){
                callInfo('搜索内容不得为空');
                return;
            }
            router.push(`/blank/`);
            setTimeout(()=>{
                router.push(`/search/${this.searchInput}/${this.type}/null`);
            }, 100);
        }
    }
}

</script>

<style scoped>

.el-input-style {
    font-family: 'Meiryo',sans-serif;
    width: 600px;
    transition: width 0.3s ease;
    height: 40px;
}

.el-input-style:hover{
    font-family: 'Meiryo',sans-serif;
    width: 700px;
    transition: width 0.3s ease;
}

:deep(.el-input__wrapper) {
    margin-left: 5px;
    font-size: 15px;
    background-color: rgba(255, 255, 255, 0.8);/*覆盖原背景颜色，设置成透明 */
    border-radius: 50px;
}

:deep(.el-input__inner) {
    margin-left: 25px;
    font-family: 'Meiryo',sans-serif;
    color: #414141;
}

.circular-icon-container {
    display: inline-block;
    width: 19px;
    height: 19px;
    line-height: 24px;
    border-radius: 50%;
    cursor: pointer;
    transition: box-shadow 0.3s ease;
    &:hover {
        box-shadow:0 0 0 4px rgba(0, 0, 0, 0.1);
    }
    .icon-search {
        margin-top: 4px;
    }
}
</style>
