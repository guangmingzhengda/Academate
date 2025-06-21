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
                                      :abstract="item.abstract ? item.abstract.slice(0, 100) + '...' : 'there is no abstract here...'"
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
                    name: 'AI and ML',
                    abstract: "This field focuses on developing algorithms and systems that allow computers to simulate human intelligence, including learning, reasoning, and problem-solving. ML, a subset of AI, emphasizes data-driven algorithms that improve with experience."
                },
                {
                    name: 'Quantum Computing',
                    abstract: "Quantum computing explores the use of quantum-mechanical phenomena, such as superposition and entanglement, to perform computation. It promises to solve certain problems faster than classical computers, especially in cryptography and complex simulations."
                },
                {
                    name: 'Gene Editing',
                    abstract: "This research focuses on techniques for modifying the DNA of living organisms. CRISPR, a revolutionary gene-editing tool, allows precise and targeted changes, leading to advancements in genetics, medicine, and agriculture."
                },
                {
                    name: 'Environmental Sustainability',
                    abstract: "This field investigates the causes, impacts, and solutions to global climate change. It includes renewable energy development, carbon capture, and strategies for sustainable environmental management to mitigate human-induced environmental degradation."
                },
                {
                    name: 'Neuroscience',
                    abstract: "Neuroscience studies the brain and nervous system, while brain-computer interfaces (BCIs) explore direct communication between the brain and external devices. This research has applications in treating neurological diseases and enhancing human-machine interactions."
                },
                {
                    name: 'Cryptography',
                    abstract: "Cybersecurity involves protecting systems, networks, and data from cyber threats, while cryptography focuses on securing communication and data through mathematical algorithms. Both fields are critical to protecting sensitive information in an increasingly digital world."
                },
                {
                    name: 'Energy Technologies',
                    abstract: "This research focuses on sustainable energy sources such as solar, wind, hydropower, and geothermal energy. It aims to reduce dependence on fossil fuels and minimize environmental impact through innovations in energy production, storage, and distribution."
                },
                {
                    name: 'Robotics and Automation',
                    abstract: "Robotics involves the design and creation of robots that can perform tasks autonomously or with minimal human intervention. Automation focuses on replacing manual processes with automated systems, enhancing efficiency in manufacturing, healthcare, and other industries."
                },
                // {
                //     name: 'Nanotechnology',
                //     abstract: "Nanotechnology involves manipulating materials at the nanoscale (atomic or molecular level) to create new materials and devices with unique properties. Applications include medicine, electronics, and materials science."
                // },
                // {
                //     name: 'Space Exploration',
                //     abstract: "Space exploration investigates the possibility of life beyond Earth and the technologies necessary for exploring outer space. Astrobiology focuses on understanding the origins, evolution, and distribution of life in the universe, including on other planets."
                // }
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
