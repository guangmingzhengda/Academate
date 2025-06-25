<template>
    <div ref="pinComponent" class="pin-content">
        <fade-box>
            <div class="box-set">
            <div class="container">
                <div class="title-container">
                    <div :class="{ titleFont: true }">热门研究</div>
                    <a class="linkStyle">
                        <div :class="{ moreFont: true }"> Academate </div>
                    </a>
                </div>
                <hr>
                <div :style="listStyle">
                    <recommend-button v-if="rTitle === 'recommend'" style="margin-top: 0"
                    v-for="item in recommendList" :r-name="item.name"
                                      :abstract="item.abstract ? item.abstract : 'there is no abstract here...'"
                    @click="callSearch(item.name)"/>
                </div>
            </div>
            </div>
        </fade-box>
    </div>
</template>

<script>

import fadeBox from "@/page/home/component/fadeBox/index.vue";
import recommendButton from "@/page/home/component/recommendButton/index.vue";
import router from "@/router";

export default {
    name: "leftPin",
    components:{fadeBox, recommendButton},
    props: ['rTitle'],
    data(){
        return{
            listStyle:{
                width: '100%',
                borderRadius: '2px',
                backgroundColor: 'rgba(205, 205, 205, 0.2)',
                overflowY: 'auto',
                flexGrow: '1',
                marginBottom: '20px'
            },
            offsetT : 0,
            recommendList: [
                {
                    name: '人工智能与机器学习',
                    abstract: "研究如何让计算机模拟人类智能，包括学习、推理和自适应，广泛应用于图像识别、自然语言处理等领域。"
                },
                {
                    name: '量子计算',
                    abstract: "探索利用量子叠加、纠缠等物理现象进行信息处理的新型计算模式，有望在密码学、材料科学等领域实现突破性进展。"
                },
                {
                    name: '基因编辑',
                    abstract: "聚焦于CRISPR等前沿技术，实现对生物体DNA的精准修改，推动医学、农业和生物技术的革新。"
                },
                {
                    name: '环境可持续发展',
                    abstract: "关注气候变化、可再生能源、碳中和等议题，致力于推动绿色技术和可持续管理，减缓人类活动对环境的影响。"
                },
                {
                    name: '脑科学与脑机接口',
                    abstract: "研究大脑结构与功能，开发脑机接口技术，实现大脑与外部设备的直接交互，助力神经疾病治疗与人机融合。"
                },
                {
                    name: '网络安全与密码学',
                    abstract: "保护信息系统免受网络攻击，研究加密算法与安全协议，保障数据隐私和数字经济安全。"
                },
                {
                    name: '新能源技术',
                    abstract: "开发太阳能、风能等清洁能源，推动储能与智能电网创新，助力能源结构转型与碳减排。"
                },
                {
                    name: '机器人与自动化',
                    abstract: "设计和制造能够自主或半自主完成任务的机器人系统，推动制造、医疗、服务等行业的智能化升级。"
                }
            ]
        }
    },
    methods:{
        callSearch(content){
            router.push(`/blank/`);
            setTimeout(()=>{
                router.push(`/search/${content}/${0}/null`);
            }, 100);
        },
        calcOffset(){
            return this.$refs.pinComponent.getBoundingClientRect().top + window.scrollY
                - parseInt(this.$refs.pinComponent.style.marginTop.match(/\d+/g));
        },
        handleScroll() {
            const componentElement = this.$refs.pinComponent;
            this.updateDistanceFromTop(componentElement);
        },
        updateDistanceFromTop(element) {
            const rect = element.getBoundingClientRect();
            const distanceFromTop = rect.top;
            this.offsetT = this.calcOffset();
            element.style.marginTop = `${
                window.scrollY-this.offsetT+90 > 0 ? Math.min(window.scrollY-this.offsetT+90, 500) : 0
            }px`;
        }
    },
    mounted() {
        window.addEventListener("scroll", this.handleScroll);
    },
    unmounted() {
        window.removeEventListener("scroll", this.handleScroll);
    }
}
</script>

<style scoped>

.container{
    width: 88%;
    height: 85%;
    margin: auto;
    display: flex;
    flex-direction: column;
}
.titleFont {
    font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
    font-weight: bold;
    font-size: 17px;
    text-align: center;
    color: #0c82e9;
}
.moreFont{
    font-family: 'meriyo', sans-serif;
    font-size: 13px;
    text-align: center;
    font-weight: bold;
    color: #d7d7d7;
}
.title-container{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 22px;
    margin-top: 10px;
}
.linkStyle{
    text-decoration: none;
    color: #000;
}
hr{
    width: 100%;
}

.pin-content{
    width: 100%;
    height: 500px;
}
.box-set{
    background-color: rgba(255, 255, 255, 0.92);
    border-radius: 5px;
    width: 100%;
    height: 100%;
    display: flex;
}
</style>
