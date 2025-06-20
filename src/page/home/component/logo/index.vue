<template>
    <div class="logo-set">

        <img class="img-set" :src="logo_url" >

        <div class="logo-font">
            Welcome to SSSR!
        </div>

        <div class="content-font">
            "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less."
        </div>

        <div class="author-font">
            - Marie Curie
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
