<template>
    <div id="app">

        <test-a-i></test-a-i>

        <div style="width: 100%; height: 100%; position: relative">

            <div v-if="!tokenSet" style="width: 100px; height: 100px;position: fixed; bottom: 0;
             right: 0; z-index: 21; opacity: 0;" @click="tokenInfo">
            </div>

            <div v-if="padSet && !vipSet" style="width: 100px; height: 100px;position: fixed; bottom: 0;
             right: 0; z-index: 20; opacity: 0;"
            @click="countEvent">
            </div>

            <navigator :class="{'nav-open': navOpen, 'nav-close': !navOpen}"/>

            <router-view style="width: 100%; height: 100%; z-index: 0; position: absolute"/>

        </div>

<!--        <router-view/>-->

    </div>
</template>

<script>

import navigator from "@/nav/index.vue";
import {computed, ref} from "vue";
import store from "@/store";
import {callError, callInfo} from "@/call";
import {canUseAI} from "@/api/ai";
import TestAI from "@/page/achievement-detail/testAI/index.vue";

export default {
    name: 'App',
    components: {TestAI, navigator},
    setup() {
        const navOpen = computed(() => store.state.navOpen);
        const tokenSet = computed(() => store.state.token);
        const vipSet = computed(() => store.state.vipSet);
        const padSet = ref(true);

        const tokenInfo = () => {
            callInfo('使用人工智能前请先登录');
        }

        const countEvent = async () => {

            padSet.value = false;
            setTimeout(() => {
                padSet.value = true;
            }, 500);

            // 计数事件
            const ok = await canUseAI();
            if (!ok) {
                padSet.value = true;
                if (!store.getters.getVipState)
                    callInfo("非vip每24h至多使用10次");
                else
                    callInfo("vip每24h至多使用50次");
                // setTimeout(() => {
                //     location.reload();
                // }, 3000)
            }

        }

        return {
            navOpen,
            tokenSet,
            vipSet,
            padSet,
            tokenInfo,
            countEvent
        }
    }
}

</script>

<style>
/*@import "asset/fonts/index.css";*/
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
::-webkit-scrollbar-thumb {
    background-color: #0fb2ff;
    opacity: 0.7;
    border-radius: 5px;
}

.nav-open{
    z-index: 10;
    position: fixed;
    top: 0;
    transition: top 0.5s;
}

.nav-close{
    z-index: 10;
    position: fixed;
    top: -80px;
    transition: top 0.5s;
}

</style>
