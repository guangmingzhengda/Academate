<template>
    <div class="col"
         @mouseenter="hover = true"
         @mouseleave="hover = false"
         @mouseover="hover = true" @click="goto">
        <a class="linkStyle">
            <div :class="{ customFont: true }">{{buttonName}}</div>
        </a>
    </div>
</template>

<script>
import store from "@/store";
import {callError} from "@/call";
export default {
    name: "navButton",
    props: ['buttonName', 'dest'],
    data(){
        return{
            hover: false, badgeSet: false, badgeValue: 0
        }
    },
    methods:{

        goto(){
            if(this.dest === '/logout') store.dispatch('logout');
            else if (this.dest !== 'null') this.$router.push(this.dest);
        },
    }
}
</script>

<style scoped>
.col{
    width: 80px;
    height: 70px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.5s ease ;
}
.col:hover{
    background-color: rgb(173, 173, 173, 0.25);
}

.linkStyle{
    text-decoration: none;
    color: #000;
    cursor: pointer;
}
.customFont {
    font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
    font-size: 16px;
    color: #353535;
}
</style>
