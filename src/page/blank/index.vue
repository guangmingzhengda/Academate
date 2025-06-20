<template>

</template>

<script>
import {useRouter} from "vue-router";
import {onBeforeUnmount, onMounted} from "vue";

export default {
    name: "blank",
    setup(){
        const router = useRouter();
        let timer = null;
        const redirectTime = 200;
        onMounted(() => {
            timer = setTimeout(() => {
                router.push("/home");
            }, redirectTime);
        });

        onBeforeUnmount(() => {
            clearTimeout(timer);
        });

        return {};
    }
}
</script>

<style scoped>

</style>
