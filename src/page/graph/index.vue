<template>
    <div class="bg-container"/>
    <div style="height: 100vh; width: 100%; display: flex; flex-direction: column;">
        <div style="position: relative; width: 100%; height: 100%; flex-grow: 1;">

            <div style="position: absolute; left: 0; top: 0; width: 20%; height: 100%; background-color: rgb(245,245,245); z-index: 5;
          display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <img
                     src="@/asset/graph/logo-blue.png"
                     alt="Logo"
                     style="width: 80%; max-width: 150px;"
                />
                <div style="margin-top: 15px; font-size: 24px; font-weight: bold; font-family: 'Meiryo', sans-serif; text-align: center;">
                    Academate-Graph
                </div>
                <div style="margin-top: 5px; font-size: 24px; font-weight: bold; font-family: '微软雅黑', sans-serif; text-align: center;">
                    社交知识图谱
                </div>
                <div style="margin-top: 30px; width: 100%;">
                    <label for="institution-filter" style="font-family: '微软雅黑', sans-serif; font-size: 16px;">按机构筛选：</label>
                    <el-input
                      v-model="institutionKeyword"
                      placeholder="输入机构名称"
                      clearable
                      @input="handleInstitutionInput"
                      @clear="handleInstitutionClear"
                      style="width: 100%; margin-top: 10px;"
                      size="large"
                      />
                </div>
                <div style="margin-top: 20px; width: 100%;">
                  <label for="researcher-search" style="font-family: '微软雅黑', sans-serif; font-size: 16px;">搜索科研人员：</label>
                  <el-select
                    v-model="selectedResearcherId"
                    filterable
                    remote
                    clearable
                    placeholder="输入科研人员姓名"
                    :remote-method="handleResearcherSearch"
                    :loading="researcherSearchLoading"
                    style="width: 100%; margin-top: 10px;"
                    @change="handleResearcherSelect"
                    @clear="handleResearcherClear"
                    size="large"
                  >
                    <el-option
                      v-for="item in researcherOptions"
                      :key="item.id"
                      :label="item.account"
                      :value="item.id"
                    >
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div 
                          style="width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;"
                        >
                          <img 
                            v-if="item.avatar" 
                            :src="item.avatar" 
                            alt="头像"
                            style="width: 100%; height: 100%; object-fit: cover;"
                            @error="e => e.target.style.display = 'none'"
                          />
                          <span 
                            v-if="!item.avatar"
                            style="color: #999; font-size: 12px; font-weight: bold;"
                          >
                            {{ item.account ? item.account.charAt(0) : '?' }}
                          </span>
                        </div>
                        <div style="flex: 1;">
                          <div style="font-weight: 500; color: #333;">{{ item.account }}</div>
                          <div style="font-size: 12px; color: #666; margin-top: 2px;" v-if="item.institution">
                            {{ item.institution }}
                          </div>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                </div>
            </div>

            <div ref="chartContainer" style="position: absolute; right: 0; width: 80%; height: 100%;
              z-index: 5"></div>

        </div>
    </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from "vue";
import * as echarts from "echarts";
import { useRoute } from "vue-router";
import router from "@/router";
import { ElSelect, ElOption, ElInput } from 'element-plus';
import { getKnowledgeGraphNetwork } from '@/api/graph';
import { searchResearchers } from '@/api/search';

export default {
    name: "SocialGraph",
    components: {
        ElSelect,
        ElOption,
        ElInput
    },
    setup() {
        const chartContainer = ref(null);
        const route = useRoute();
        const showPanel = ref(false);
        const selectedNode = ref(null);
        
        // 机构搜索相关
        const institutionKeyword = ref("");
        
        // 科研人员搜索相关
        const selectedResearcherId = ref(null);
        const researcherOptions = ref([]);
        const researcherSearchLoading = ref(false);
        
        // 高亮状态
        const persistentHighlight = ref(false);
        const lastHighlightIndexes = ref([]);
        const panelPosition = ref({ x: 0, y: 0 });

        let chartInstance = null;
        let allNodes = [];
        let allLinks = [];

        const categories = [
            { name: "科研人员", itemStyle: { color: "#4B9EFF" } },
            { name: "机构", itemStyle: { color: "#FF7043" } },
        ];

        const onNodeHover = (params) => {
            showPanel.value = true;
            selectedNode.value = params;
            // 计算悬浮面板位置（跟随鼠标）
            if (params.event && params.event.event) {
                const mouseEvent = params.event.event;
                // 适当偏移，避免遮挡鼠标
                panelPosition.value = {
                    x: mouseEvent.offsetX + 20,
                    y: mouseEvent.offsetY - 10
                };
            }
            if (persistentHighlight.value) return;
            if (params.data.category === 1 && chartInstance) {
                const highlightIndexes = allNodes.reduce((acc, node, idx) => {
                    if (node.name === params.name || node.institution === params.name) {
                        acc.push(idx);
                    }
                    return acc;
                }, []);
                chartInstance.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                });
                chartInstance.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    dataIndex: highlightIndexes
                });
            } else if (params.data.category === 0 && chartInstance) {
                const idx = allNodes.findIndex(node => node.category === 0 && node.id === params.data.id);
                if (idx !== -1) {
                    chartInstance.dispatchAction({
                        type: 'downplay',
                        seriesIndex: 0,
                    });
                    chartInstance.dispatchAction({
                        type: 'highlight',
                        seriesIndex: 0,
                        dataIndex: idx
                    });
                }
            }
        };

        const onNodeOut = () => {
            showPanel.value = false;
            selectedNode.value = null;
            if (persistentHighlight.value) return;
            if (chartInstance) {
                chartInstance.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                });
            }
        };

        const onNodeClick = (params) => {
            if (params.data.category === 0) { // 科研人员
                router.push(`/profile/${params.data.id}`);
            } else if (params.data.category === 1) { // 机构
                institutionKeyword.value = params.name;
                loadGraphData();
            }
        };

        const initChart = (nodes, links) => {
            if (chartContainer.value) {
                chartInstance = echarts.init(chartContainer.value);
                const option = {
                    tooltip: {
                        backgroundColor: 'rgba(255,255,255,0.98)',
                        borderColor: '#aaa',
                        borderWidth: 1,
                        textStyle: {
                            color: '#222',
                            fontSize: 18,
                            fontFamily: 'Meiryo, 微软雅黑, sans-serif',
                        },
                        extraCssText: 'box-shadow:0 2px 12px rgba(0,0,0,0.15);border-radius:10px;min-width:200px;max-width:320px;',
                        formatter: (params) => {
                            if (params.dataType === "node") {
                                const data = params.data;
                                if (data.category === 0) {
                                    return `
                                        <div style="text-align:center;">
                                            <div style="font-size:20px;font-weight:bold;margin-bottom:4px;">${data.name}</div>
                                            <div style="color:#666;font-size:15px;">机构：${data.institution}</div>
                                            <div style="color:#666;font-size:15px;">影响力：${data.influence}</div>
                                            ${data.field ? `<div style='color:#666;font-size:15px;'>领域：${data.field}</div>` : ''}
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div style="text-align:center;">
                                            <div style="font-size:20px;font-weight:bold;margin-bottom:4px;">${data.name}</div>
                                            <div style="color:#666;font-size:15px;">类型：科研机构</div>
                                            <div style="color:#666;font-size:15px;">影响力：${data.influence}</div>
                                        </div>
                                    `;
                                }
                            }
                            return "";
                        },
                    },
                    legend: [{
                        data: categories.map(a => a.name),
                        bottom: 20,
                        left: 'center',
                        textStyle: {
                            color: '#333',
                            fontSize: 14,
                            // fontWeight: 'bold'
                        },
                        itemWidth: 38,
                        itemHeight: 22,
                    }],
                    series: [{
                        type: "graph",
                        layout: "force",
                        data: nodes.map(node => ({
                            ...node,
                            symbolSize: Math.max(60, Math.min(110, node.influence / 3)),
                            itemStyle: node.category === 0 ? {
                                borderColor: '#fff',
                                borderWidth: 2,
                                shadowBlur: 18,
                                shadowColor: 'rgba(0,0,0,0.18)',
                                color: '#4B9EFF',
                            } : {
                                borderColor: '#fff',
                                borderWidth: 2,
                                color: {
                                    type: 'linear',
                                    x: 0, y: 1, x2: 0, y2: 0,
                                    colorStops: [
                                        { offset: 0, color: '#FF7043' },
                                        { offset: 1, color: '#ffcc80' }
                                    ]
                                },
                                shadowBlur: 12,
                                shadowColor: 'rgba(255,180,71,0.18)'
                            },
                            draggable: true
                        })),
                        links: links,
                        categories: categories,
                        roam: true,
                        label: {
                            show: true,
                            position: "right",
                            formatter: "{b}",
                            fontSize: 15,
                            fontWeight: 'bold',
                            color: '#3a3a3a',
                            textBorderColor: '#fff',
                            textBorderWidth: 2,
                            layout: {
                                hideOverlap: true
                            }
                        },
                        force: {
                            repulsion: 500,
                            edgeLength: [140, 200],
                            gravity: 0.04
                        },
                        emphasis: {
                            focus: 'adjacency',
                            lineStyle: {
                                width: 12,
                                color: '#7ec8e3',
                                opacity: 0.7
                            },
                            itemStyle: {
                                shadowBlur: 30,
                                shadowColor: 'rgba(30,144,255,0.45)',
                                borderColor: '#fff',
                                borderWidth: 2
                            }
                        },
                        lineStyle: {
                            color: '#8CACCD',
                            curveness: 0.08,
                            opacity: 0.55,
                            width: 4
                        }
                    },
                ],
                };

                chartInstance.setOption(option);
                chartInstance.on("mouseover", (params) => {
                    if (params.dataType === "node") onNodeHover(params);
                });
                chartInstance.on("mouseout", (params) => {
                    if (params.dataType === "node") onNodeOut();
                });
                chartInstance.on("click", (params) => {
                    if (params.dataType === "node") onNodeClick(params);
                    else {
                        persistentHighlight.value = false;
                        lastHighlightIndexes.value = [];
                        chartInstance.dispatchAction({
                            type: 'downplay',
                            seriesIndex: 0,
                        });
                    }
                });

                window.addEventListener("resize", () => chartInstance.resize());
            }
        };
        
        // 加载图谱数据
        const loadGraphData = async () => {
            // 如果两个框都没有填内容，不请求数据
            if (!institutionKeyword.value && !selectedResearcherId.value) {
                if (chartInstance) {
                    // 清空图谱
                    chartInstance.setOption({
                        series: [{
                            data: [],
                            links: []
                        }]
                    });
                }
                return;
            }

            try {
                const response = await getKnowledgeGraphNetwork(
                    selectedResearcherId.value ? Number(selectedResearcherId.value) : undefined,
                    institutionKeyword.value || undefined
                );
                
                if (response && response.code === 0 && response.data) {
                    allNodes = response.data.nodes || [];
                    allLinks = response.data.links || [];
                    
                    await nextTick(() => {
                        initChart(allNodes, allLinks);
                    });
                }
            } catch (error) {
                console.error('加载图谱数据失败:', error);
                    }
        };

        // 防抖计时器
        let institutionDebounceTimer = null;
        
        // 机构输入处理（防抖）
        const handleInstitutionInput = () => {
            if (institutionDebounceTimer) {
                clearTimeout(institutionDebounceTimer);
            }
            
            institutionDebounceTimer = setTimeout(() => {
                loadGraphData();
            }, 500); // 500ms防抖
        };
        
        const handleInstitutionClear = () => {
            institutionKeyword.value = '';
            loadGraphData();
        };

        // 科研人员搜索防抖计时器
        let researcherSearchTimer = null;
        
        // 科研人员搜索处理（防抖）
        const handleResearcherSearch = async (query) => {
            if (!query || query.trim() === '') {
                researcherOptions.value = [];
                return;
            }
            
            // 清除之前的计时器
            if (researcherSearchTimer) {
                clearTimeout(researcherSearchTimer);
            }
            
            researcherSearchLoading.value = true;
            
            researcherSearchTimer = setTimeout(async () => {
                try {
                    const result = await searchResearchers({
                        userName: query.trim(),
                        pageSize: 10
                    });
                    
                    if (result && result.list) {
                        researcherOptions.value = result.list;
                    } else {
                        researcherOptions.value = [];
                    }
                } catch (error) {
                    console.error('搜索科研人员失败:', error);
                    researcherOptions.value = [];
                } finally {
                    researcherSearchLoading.value = false;
                }
            }, 300); // 300ms防抖
        };
        
        const handleResearcherSelect = (userId) => {
            if (userId) {
                loadGraphData();
            }
        };
        
        const handleResearcherClear = () => {
            selectedResearcherId.value = null;
            researcherOptions.value = [];
            loadGraphData();
        };

        onMounted(async () => {
            // 初始化空图谱，等待用户输入搜索条件
            allNodes = [];
            allLinks = [];
                
                await nextTick(() => {
                    initChart(allNodes, allLinks);
                });
        });

        return {
            chartContainer,
            showPanel,
            selectedNode,
            panelPosition,
            
            // 机构搜索
            institutionKeyword,
            handleInstitutionInput,
            handleInstitutionClear,
            
            // 科研人员搜索
            selectedResearcherId,
            researcherOptions,
            researcherSearchLoading,
            handleResearcherSearch,
            handleResearcherSelect,
            handleResearcherClear,
            
            // 数据加载
            loadGraphData,
        };
    },
};
</script>

<style scoped>
.bg-container {
    background: #fbfbfb;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -3;
    top: 0;
    left: 0;
}
.w2{
    width: 20%;
    transition: width 0.3s ease-in-out;
    opacity: 1;
}
.w0{
    width: 0;
    opacity: 0;
    transition: width 0.3s ease-in-out, opacity 0.3s ease-in-out;
    padding-left: 0 !important;
    padding-right: 0 !important;
    overflow: hidden;
}
select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007AFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right .7em top 50%, 0 0;
    background-size: .65em auto, 100%;
}
</style>
