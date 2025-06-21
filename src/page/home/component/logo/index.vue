<template>
    <div class="logo-set">

        <img class="img-set" :src="logo_url" >

        <!-- <div class="logo-font">
            Welcome to SSSR!
        </div> -->

        <div class="content-font">
            Research is a mix of excitement and frustration—endless experiments, unexpected results, and late-night breakthroughs. Coffee fuels the grind, while curiosity drives the chase for answers. Failed trials teach resilience; small victories bring joy. It’s a journey of persistence, where every discovery, big or small, feels like unlocking a piece of the universe’s puzzle.
        </div>

        <div class="author-font">
            - RyotoBUAA
        </div>

    </div>
</template>

<script>

export default {
    name: "logo",
    setup(){
        const logo_url = require("@/asset/home/logo.png")
        return {
            logo_url
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
}
.author-font{
    width: 90%;
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    text-align: right;
    color: #969696;
    margin-bottom: 25px;
}
</style>
