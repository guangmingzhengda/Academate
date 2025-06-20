<template>
    <div class="bottom-style">
        <div :class="{ trademark: true }"> Significant Shared Science Research </div>
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
    background-color: rgba(255, 255, 255, 0.2);
}
.trademark{
    font-family: 'meiryo', sans-serif;
    font-weight: bold;
    font-size: 30px;
    margin: auto;
    color: white;
}
</style>
