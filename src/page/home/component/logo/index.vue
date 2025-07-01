<template>
    <div class="logo-set">

        <img class="img-set" :src="logo_url" >

        <!-- <div class="logo-font">
            Welcome to SSSR!
        </div> -->

        <div class="content-font" :class="{ 'content-visible': contentVisible }">
            {{ displayedText }}<span class="cursor" v-show="showCursor">|</span>
        </div>

        <div class="author-font" :class="{ 'author-visible': authorVisible }">
            {{ displayedAuthor }}
        </div>

    </div>
</template>

<script>

import { ref, onMounted } from 'vue'

export default {
    name: "logo",
    setup(){
        const logo_url = require("@/asset/home/logo.png")
        
        // 打字机效果相关数据
        const fullText = "Research is a mix of excitement and frustration—endless experiments, unexpected results, and late-night breakthroughs. Coffee fuels the grind, while curiosity drives the chase for answers. Failed trials teach resilience; small victories bring joy. It's a journey of persistence, where every discovery, big or small, feels like unlocking a piece of the universe's puzzle."
        const fullAuthor = "- RyotoBUAA"
        
        const displayedText = ref('')
        const displayedAuthor = ref('')
        const showCursor = ref(true)
        const contentVisible = ref(false)
        const authorVisible = ref(false)
        
        // 打字机效果函数
        const typeWriter = async () => {
            // 先让内容区域渐变显示
            contentVisible.value = true
            
            // 打字效果 - 主文本
            for (let i = 0; i <= fullText.length; i++) {
                displayedText.value = fullText.slice(0, i)
                await new Promise(resolve => setTimeout(resolve, 7)) // 每个字符7ms，超快速度
            }
            
            // 主文本完成后，稍作停顿
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // 隐藏光标，显示作者区域
            showCursor.value = false
            authorVisible.value = true
            
            // 打字效果 - 作者签名
            for (let i = 0; i <= fullAuthor.length; i++) {
                displayedAuthor.value = fullAuthor.slice(0, i)
                await new Promise(resolve => setTimeout(resolve, 25)) // 作者签名25ms，快速完成
            }
        }
        
        onMounted(() => {
            // 页面加载后延迟1秒开始打字机效果
            setTimeout(() => {
                typeWriter()
            }, 1000)
        })
        
        return {
            logo_url,
            displayedText,
            displayedAuthor,
            showCursor,
            contentVisible,
            authorVisible
        }
    }
}
</script>

<style scoped>
.logo-set{
    background-color: rgba(255, 255, 255, 0.92);
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 5px;
}
.img-set{
    width: 200px;
    height: 200px;
    margin-top: 25px;
}
.logo-font{
    font-family: 'Meiryo', sans-serif;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    color: #2f2f2f;
}
.content-font{
    width: 90%;
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    text-align: left;
    color: #969696;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s ease;
    min-height: 120px; /* 保持高度稳定 */
    line-height: 1.5;
}

.content-font.content-visible {
    opacity: 1;
    transform: translateY(0);
}

.author-font{
    width: 90%;
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    text-align: right;
    color: #969696;
    margin-bottom: 25px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.6s ease;
}

.author-font.author-visible {
    opacity: 1;
    transform: translateY(0);
}

/* 光标样式 */
.cursor {
    font-weight: bold;
    color: #409eff;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
}
</style>
