<template>
    <div class="box-set">

        <img class="img-set" :src="logo_url" >

        <div style="width: 190px; display: flex; justify-content: left;
         flex-direction: column; margin-left: 10px">

            <div class="titleFont">
                {{name}}
            </div>

            <div class="valueFont">
                {{value}}
            </div>

        </div>

    </div>
</template>

<script>

import {ref} from "vue";

export default {
    name: "homeMsg",
    props:[
        'name',
        'value',
        'photo'
    ],
    setup(props){
        const logo_url = require("@/asset/home/" + props.photo + ".png")
        const value_list = ref([props.value])
        return {
            logo_url,
            value_list
        }
    }
}
</script>

<style scoped>
.box-set{
    width: 230px;
    height: 130px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}
.img-set{
    width: 70px;
    height: 70px;
}

.titleFont {
    font-family: 'Meiryo', sans-serif;
    font-weight: bold;
    color: rgba(24, 24, 24, 0.9);
    font-size: 20px;
    text-align: left;
}

.valueFont {
    font-family: 'Meiryo', sans-serif;
    color: rgba(24, 24, 24, 0.9);
    font-size: 20px;
    text-align: left;
}

</style>
