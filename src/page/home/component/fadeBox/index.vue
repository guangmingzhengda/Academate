<template>
  <!--    <transition name="fade">-->
    <div :class="{op1: isVisible, op2: !isVisible}" ref="fadeContent">
        <div :class="{mt1: isVisible, mt2: !isVisible}">
            <slot></slot>
        </div>
    </div>
  <!--    </transition>-->
</template>

<script>
export default {
    data() {
        return {
            isVisible: false
        };
    },
    mounted() {

        setTimeout(()=>{
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0) {
                        setTimeout(()=>{
                            this.isVisible = true;
                            observer.unobserve(entry.target);
                        }, 500);
                    }
                });
            });
            observer.observe(this.$refs.fadeContent);
        }, 200);

    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 1s;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
.op1{
    opacity: 100%;
    transition: opacity 0.2s;
}
.op2{
    opacity: 0;
    transition: opacity 0.2s;
}
.mt1{
    margin-top: 0;
    transition: margin-top 0.6s;
}
.mt2{
    margin-top: 50px;
    transition: margin-top 0.6s;
}
</style>
