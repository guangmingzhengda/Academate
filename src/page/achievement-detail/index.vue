<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    

<!--    <home-bottom/>-->

</template>

<script lang="js">

export default {
    name: "achievement-detail",
    data() {
        return {
        }
    }
}
</script>

<style scoped>
.bg-container {
    background: url('@/asset/detail-enhance/bg.png');
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -1;
    top: 0;
    left: 0;
}
.bg-strong-container {
    background: url('@/asset/login/bg.png');
    opacity: 0.9;
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -2;
    top: 0;
    left: 0;
}
.main-container {
    flex: 1;
    width: 90%;
    margin: 10px;
    box-sizing: border-box;
}
.side-container {
    width: 90%;
    background-color: rgba(255, 255, 255, 0.9);
    margin: 10px;
    box-sizing: border-box;
    padding: 15px;
}
.header-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    text-align: left;
    align-self: flex-start;
}
.down-container {
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    word-wrap: break-word;
    text-align: left;
}
.down-container {
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    text-align: left;
    align-self: flex-start;
}
.header-title {
    font-size: 28px;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 10px;
}

.abstract-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 10px;
}

.abstract-content {
    font-size: 1.1rem;
    color: #495057;
    text-align: justify;
    line-height: 1.5;
}

.info-container {
    display: flex;
    margin-bottom: 20px;
    flex-direction: column;
}

.detail-info {
    font-size: 1.2rem;
    color: #6c757d;
}

.info-label {
    font-weight: bold;
    margin-right: 5px;
}
.author-link {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.3s, text-decoration 0.3s;
}

.author-link:hover {
    color: #aed0ee;
    text-decoration: underline;
}

</style>
