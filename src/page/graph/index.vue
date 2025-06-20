<template>
    <div style="height: 100vh; width: 100%;">
        <div style="position: relative; width: 100%; height: 100%">

            <div style="width: 20%; position: absolute; height: 100%; background-color: rgb(245,245,245); z-index: 5;
          display: flex; flex-direction: column; justify-content: center; align-items: center">
                <img
                     src="@/asset/graph/logo-blue.png"
                     alt="Button Image"
                     class="button-image"
                     style="width: 80%"
                />
                <div style="margin-top: 5px; font-size: 28px; font-weight: bold;
                  font-family: 'Meiryo', sans-serif;">
                    SSSR-Graph
                </div>
                <div style="margin-top: 5px; font-size: 28px; font-weight: bold;
                  font-family: '微软雅黑', sans-serif">
                    专家知识网络
                </div>
            </div>

          <div style="position: absolute; height: 100%; background-color: rgb(235,235,235); z-index: 6;
          display: flex; flex-direction: column; justify-content: center; align-items: center"
          :class="{'w2': w28, 'w0': !w28}">

              <div style="width: 80%; display: flex; flex-direction: column; align-items: center">

                <img v-if="w28 && !author_set"
                      src="@/asset/graph/archive-research.png"
                      alt="Button Image"
                      class="button-image"
                      style="width: 80%"
                />

                  <img v-if="w28 && author_set"
                       src="@/asset/graph/graduate-cap.png"
                       alt="Button Image"
                       class="button-image"
                       style="width: 80%"
                  />

                  <div v-if="w28" style="margin-top: 10px; font-size: 20px; font-weight: bold;
                  font-family: 'Meiryo', sans-serif">
                      {{selected}}
                  </div>

                  <div v-if="w28" style="margin-top: 5px; font-size: 15px;
                  font-family: 'Meiryo', sans-serif; color: #6a6a6a">
                  {{selected_abstract}}
                  </div>

              </div>
          </div>

          <div ref="chartContainer" style="position: absolute; width: 80%; height: 100%; margin-left: 20%;
              z-index: 5"></div>

        </div>
    </div>
</template>

<script>
import { ref, onMounted, nextTick } from "vue";
import * as echarts from "echarts";
import {setNav} from "@/nav/set";
import {getGraph} from "@/api/graph";
import { useRoute } from "vue-router";
import router from "@/router";
import {getWorkAPI} from "@/page/achievement-detail/api/api";
import {getProfileDetail} from "@/api/profile";

export default {
    name: "graph",
    setup() {
        const chartContainer = ref(null);
        const route = useRoute();
        const author_id = ref(-1)
        const selected = ref('doordoor')
        const selected_abstract = ref('')
        const w28 = ref(false);
        const author_set = ref(true)
        const mark = ref([])
        const mark_map = ref(new Map())

        const color_list = [
            '#00d6ff',
            '#0fc0ff',
            '#00ccff',
            '#00daff',
            '#00ced5'
        ];

        const onNodeHover = async (params) => {
            // alert(`你悬停在节点: ${params.name}`);
            w28.value = true;
            selected.value = params.name;
            // 左部信息设置
            author_set.value = !mark.value.includes(params.name);

            if (mark.value.includes(params.name)){
                const work_detail = await getWorkAPI(mark_map.value[params.name]);
                // console.log(work_detail)
                selected_abstract.value = work_detail.subfield;
            }else{
                const profile_detail = await getProfileDetail(mark_map.value[params.name]);
                // console.log(profile_detail)
                selected_abstract.value = profile_detail.institution.name;
            }
        };

        const onNodeClick = (params) => {
            // // alert(`你悬停在节点: ${params.name}`);
            // w28.value = true;
            // selected.value = params.name;
            // // 左部信息设置
            // author_set.value = !mark.value.includes(params.name);
            if (mark.value.includes(params.name)){
                router.push(`/achievement-detail/${mark_map.value[params.name]}`)
            }else{
                router.push(`/profile/${mark_map.value[params.name]}`)
            }
        };

        const onNodeOut = (params) => {
            w28.value = false;
        };

        let chartInstance = null;
        const initChart = (data_in, link_in) => {
            if (chartContainer.value) {
                // 初始化图表实例
                chartInstance = echarts.init(chartContainer.value);

                // 配置图表选项
                const option = {
                    tooltip: {
                        trigger: "item",
                        formatter: (params) => {
                            // 如果是边（link）
                            if (params.dataType === "edge") {
                                return `${params.data.value}关系`; // 显示边的 value 值
                            }
                            return `${params.name}`; // 默认显示节点名称
                        },
                    },
                    series: [
                        {
                            type: "graph",
                            layout: "force", // 力导向布局
                            data: data_in,
                                //{ name: "科研工作者A", value: 10, symbolSize: 50, itemStyle: { color: "#11b9f5" } },
                            links: link_in,
                                // { source: "科研工作者F", target: "科研工作者1", value: "合作" },
                            force: {
                                repulsion: 2000, // 节点间的斥力大小
                                edgeLength: [150, 500], // 边的长度范围
                                layoutAnimation: true,
                            },
                            label: {
                                show: true,
                                position: "inside",
                                formatter: (params) => {
                                    // 根据节点类型动态返回显示内容
                                    if (params.data.type === 'work') {
                                        return params.data.name.charAt(0); // 只显示首字母
                                    }
                                    return params.data.name; // 显示完整名称
                                },
                                fontSize: 16, // 设置字体大小
                                fontWeight: "bold", // 设置字体加粗
                                color: "#ffffff",
                                textBorderColor: "#002d39", // 设置文本边框颜色为黑色
                                textBorderWidth: 1, // 设置文本边框宽度为 2px
                            },
                            lineStyle: {
                                color: "#00c4ff", // 边的颜色随源节点变化
                                width: 5,
                            },
                            roam: true, // 支持缩放和平移
                            emphasis: {
                                focus: "adjacency",
                                lineStyle: {
                                    width: 3,
                                },

                            },
                        },
                    ],
                    animationDuration: 15000,
                    animationEasing: "cubicOut",
                };

                // 设置图表选项
                chartInstance.setOption(option);

                chartInstance.on("mouseover", (params) => {
                    if (params.dataType === "node") {
                        // 如果是节点被悬停，调用自定义函数
                        onNodeHover(params);
                    }
                });

                chartInstance.on("click", (params) => {
                    if (params.dataType === "node") {
                        onNodeClick(params);
                    }
                });

                chartInstance.on("mouseout", (params) => {
                    if (params.dataType === "node") {
                        // 如果是鼠标离开节点，调用自定义函数
                        onNodeOut(params);
                    }
                });

                // 监听窗口大小变化，确保图表自适应
                window.addEventListener("resize", () => chartInstance.resize());
            }
        };

        onMounted(async() => {

            author_id.value = route.params.id;
            const edges = await getGraph(author_id.value);
            const points = new Set();
            const data_in = [];
            const link_in = [];

            for (let i=0; i<edges.length && i<40; i++){
                mark_map.value[edges[i].lastNodeName] = edges[i].lastNodeId;
                mark_map.value[edges[i].midNodeName] = edges[i].midNodeId;
                points.add('0' + edges[i].lastNodeName);
                points.add('1' + edges[i].midNodeName);
                link_in.push({
                    source: edges[i].lastNodeName,
                    target: edges[i].midNodeName,
                    value: edges[i].lastNodeLabels[0] + "-" + edges[i].midNodeLabels[0]
                })
            }

            points.forEach((point) => {
                if (point.charAt(0) === '1'){
                    data_in.push({
                        name: point.slice(1),
                        value: 10,
                        symbolSize: 100,
                        itemStyle: { color: color_list[Math.floor(Math.random() * color_list.length)] },
                        type: 'work'
                    })
                    mark.value.push(point.slice(1))
                }else{
                    data_in.push({
                        name: point.slice(1),
                        value: 10,
                        symbolSize: 60,
                        itemStyle: { color: color_list[Math.floor(Math.random() * color_list.length)] },
                        type: 'author'
                    })
                }
            });

            // setNav(true);
            await nextTick(initChart(data_in, link_in));
        });

        return {
            chartContainer,
            selected,
            w28,
            selected_abstract,
            author_set
        };
    },
}
</script>

<style scoped>
.w2{
    width: 20%;
    transition: width 0.3s;
}
.w8{
    width: 80%;
    transition: width 0.3s;
}
.w10{
    width: 100%;
    transition: width 0.3s;
}
.w0{
    width: 0;
    transition: width 0.3s;
}
</style>
