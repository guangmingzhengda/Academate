<template>
    <div class="bottom-style">
        <div :class="{ trademark: true }"> Academate Platform 2025 </div>
    </div>
</template>

<script>
export default {
    name: "homeBottom"
}
</script>

<style scoped>
.bottom-style{
    margin-top: 60px;
    width: 100%;
    height: 150px;
    display: flex;
    background-color: rgba(255, 255, 255, 0.2);
}
.trademark{
    font-family: 'Brush Script MT', cursive;
    /* font-weight: bold; */
    font-size: 48px;
    margin: auto;
    color: rgb(255, 255, 255);
}
</style>
