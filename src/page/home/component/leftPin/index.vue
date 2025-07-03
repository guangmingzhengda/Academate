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
                    <!-- 加载状态 -->
                    <div v-if="loading" class="loading-state">
                        正在加载推荐内容...
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-else-if="recommendList.length === 0" class="empty-state">
                        暂无推荐内容
                    </div>
                    
                    <!-- 推荐列表 -->
                    <div 
                        v-else
                        v-for="item in recommendList" 
                        :key="item.outcomeId"
                        class="recommend-item"
                        @click="goToDetail(item)"
                    >
                        <div class="recommend-content">
                            <div class="recommend-header">
                                <span class="recommend-type" :class="item.type">
                                    {{ typeLabels[item.type] || item.type }}
                                </span>
                                <div class="recommend-title">{{ truncateTitle(item.title) }}</div>
                            </div>
                            <div class="recommend-meta">
                                <div v-if="item.authors || item.journal" class="meta-item">
                                    {{ truncateMetaText(item.authors, item.journal) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </fade-box>
    </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import fadeBox from "@/page/home/component/fadeBox/index.vue";
import axios from 'axios';

export default {
    name: "leftPin",
    components:{fadeBox},
    props: ['rTitle'],
    setup(){
        const router = useRouter();
        
        // 响应式数据
        const loading = ref(false);
        const recommendList = ref([]);
        
        // 样式配置
        const listStyle = {
            width: '100%',
            borderRadius: '2px',
            backgroundColor: 'rgba(205, 205, 205, 0.2)',
            overflowY: 'auto',
            flexGrow: '1',
            marginBottom: '20px'
        };
        
        // 成果类型标签
        const typeLabels = {
            '期刊论文': '期刊',
            '会议论文': '会议', 
            '专利': '专利',
            '书': '书',
            '技术报告': '报告',
            '海报': '海报',
            '数据': '数据',
            '其他': '其他'
        };
        
        // 直接从后端加载推荐数据（不使用缓存）
        const loadRecommendations = async () => {
            loading.value = true;
            try {
                console.log('每次都从后端重新获取推荐数据');
                
                // 直接调用API获取数据
                const response = await axios.get('/recommendation/popular', {
                    params: {
                        pageSize: 8,
                        pageNum: 1
                    }
                });

                if (response.status === 200 && response.data.code === 0) {
                    recommendList.value = response.data.data.list || [];
                    console.log(`成功获取 ${recommendList.value.length} 条推荐数据`);
                } else {
                    console.error('获取推荐数据失败:', response.data.message);
                    recommendList.value = [];
                }
            } catch (error) {
                console.error('加载推荐数据失败:', error);
                recommendList.value = [];
            } finally {
                loading.value = false;
            }
        };
        
        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };
        
        // 跳转到详情页
        const goToDetail = (item) => {
            router.push(`/outcome-detail/${item.outcomeId}`);
        };
        
        // 截断标题
        const truncateTitle = (title) => {
            if (!title) return '';
            const maxLength = 25; // 最大显示字符数
            return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
        };
        
        // 截断元信息文本（作者和期刊）
        const truncateMetaText = (authors, journal) => {
            let metaText = '';
            if (authors && journal) {
                metaText = `作者：${authors} | 刊物：${journal}`;
            } else if (authors) {
                metaText = `作者：${authors}`;
            } else if (journal) {
                metaText = `刊物：${journal}`;
            }
            
            const maxLength = 35; // 最大显示字符数（增加以适应标签）
            return metaText.length > maxLength ? metaText.substring(0, maxLength) + '...' : metaText;
        };
        
        onMounted(() => {
            loadRecommendations();
        });
        
        return {
            recommendList,
            loading,
            listStyle,
            typeLabels,
            loadRecommendations,
            formatDate,
            goToDetail,
            truncateTitle,
            truncateMetaText
        };
    },
    data(){
        return{
            offsetT : 0
        }
    },
    methods:{
        callSearch(content){
            this.$router.push(`/blank/`);
            setTimeout(()=>{
                this.$router.push(`/search/${content}/${0}/null`);
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

/* 新增样式 */
.loading-state, .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
    padding: 20px;
    font-size: 14px;
    text-align: center;
}

.recommend-item {
    padding: 8px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.recommend-item:hover {
    background-color: rgba(0, 158, 255, 0.1);
}

.recommend-item:last-child {
    border-bottom: none;
}

.recommend-content {
    width: 100%;
    text-align: left;
}

.recommend-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.recommend-title {
    font-family: 'Microsoft YaHei', sans-serif;
    font-size: 13px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1.2;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
}

.recommend-type {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
}

.recommend-type.期刊论文 {
    background-color: #67c23a;
}

.recommend-type.会议论文 {
    background-color: #409eff;
}

.recommend-type.专利 {
    background-color: #e6a23c;
}

.recommend-type.书 {
    background-color: #909399;
}

.recommend-type.技术报告 {
    background-color: #8e44ad;
}

.recommend-type.海报 {
    background-color: #e67e22;
}

.recommend-type.数据 {
    background-color: #1abc9c;
}

.recommend-type.其他 {
    background-color: #95a5a6;
}

.recommend-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.meta-item {
    font-size: 10px;
    color: #666;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
}

</style>
