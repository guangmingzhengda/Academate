<template>
    <div class="bottom-style">
        <div :class="{ trademark: true }"> ACADEMATE PLATFORM 2025 </div>
    </div>
</template>

<script>
export default {
    name: "homeBottom"
}
</script>

<style scoped>
.bottom-style{
    margin-top: 20px;
    width: 100%;
    height: 150px;
    display: flex;
    background-color: rgba(255, 255, 255, 0.5);
}
.trademark{
    font-family: 'meiryo', sans-serif;
    font-weight: bold;
    font-size: 30px;
    margin: auto;
    color: rgb(49, 49, 49);
}
</style>
