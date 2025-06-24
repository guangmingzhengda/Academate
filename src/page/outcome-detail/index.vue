<template>
  <div class="bg-container"/>
  <div class="bg-strong-container"/>
  <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
    <div style="width: 1400px">
      <el-container class="el-main" style="display: flex;">
        <el-row style="width: 100%">
          <el-col :span="18">
            <div class="main-container" style="width: 100%;">
              <div v-if="loading" class="loading-container">
                <el-skeleton :rows="10" animated />
              </div>
              <div v-else-if="outcomeData">
                <!-- 成果标题 -->
                <div class="header-container">
                  <div class="header-title">{{ outcomeData.title }}</div>
                  <div class="info-container">
                    <!-- 作者信息 -->
                    <div class="detail-info">
                      <span class="info-label">作者：</span>
                      <span>{{ outcomeData.authors || '未知' }}</span>
                    </div>
                    
                    <!-- 期刊信息 -->
                    <div class="detail-info" v-if="outcomeData.journal">
                      <span class="info-label">期刊：</span>
                      <span>{{ outcomeData.journal }}</span>
                    </div>
                    
                    <!-- 卷期信息 -->
                    <div class="detail-info" v-if="outcomeData.volume || outcomeData.issue">
                      <span class="info-label">卷期：</span>
                      <span>{{ formatVolumeIssue(outcomeData) }}</span>
                    </div>
                    
                    <!-- 页码信息 -->
                    <div class="detail-info" v-if="outcomeData.pages">
                      <span class="info-label">页码：</span>
                      <span>{{ outcomeData.pages }}</span>
                    </div>
                    
                    <!-- 发布日期 -->
                    <div class="detail-info" v-if="outcomeData.publishDate">
                      <span class="info-label">发布时间：</span>
                      <span>{{ formatDate(outcomeData.publishDate) }}</span>
                    </div>
                    
                    <!-- DOI信息 -->
                    <div class="detail-info" v-if="outcomeData.doi">
                      <span class="info-label">DOI：</span>
                      <a :href="'https://doi.org/' + outcomeData.doi" target="_blank" class="doi-link">{{ outcomeData.doi }}</a>
                    </div>
                    
                    <!-- 专利号 -->
                    <div class="detail-info" v-if="outcomeData.patentNumber">
                      <span class="info-label">专利号：</span>
                      <span>{{ outcomeData.patentNumber }}</span>
                    </div>
                    
                    <!-- 更多信息可以在这里添加 -->
                  </div>
                  
                  <!-- 功能按钮区 -->
                  <div class="action-container">
                    <el-button type="primary" icon="el-icon-star-off" size="small">收藏</el-button>
                    <el-button type="primary" icon="el-icon-thumb" size="small">点赞</el-button>
                    <el-button type="primary" icon="el-icon-share" size="small">分享</el-button>
                    <el-button v-if="outcomeData.url" type="success" icon="el-icon-download" size="small" @click="openUrl(outcomeData.url)">查看原文</el-button>
                    <el-button type="primary" icon="el-icon-upload" size="small" @click="showUploadDialog">上传PDF</el-button>
                  </div>
                  
                  <!-- 文件上传对话框 -->
                  <el-dialog
                    v-model="uploadDialogVisible"
                    title="上传研究成果文件"
                    width="500px"
                  >
                    <div class="upload-container">
                      <p class="upload-tip">请选择要上传的PDF文件</p>
                      <el-upload
                        class="pdf-uploader"
                        :auto-upload="false"
                        :limit="1"
                        accept=".pdf"
                        :on-change="handleFileChange"
                        :file-list="fileList"
                      >
                        <el-button type="primary">选择文件</el-button>
                        <template #tip>
                          <div class="el-upload__tip">
                            只能上传PDF文件
                          </div>
                        </template>
                      </el-upload>
                    </div>
                    <template #footer>
                      <span class="dialog-footer">
                        <el-button @click="uploadDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="uploadFile" :loading="uploading" :disabled="!selectedFile">
                          上传
                        </el-button>
                      </span>
                    </template>
                  </el-dialog>
                </div>
                
                <!-- 相关研究成果推荐 -->
                <div class="down-container">
                  <div class="section-title">相关推荐</div>
                  <div class="related-container">
                    <el-empty v-if="!relatedOutcomes || relatedOutcomes.length === 0" description="暂无相关推荐" />
                    <div v-else class="related-list">
                      <div v-for="(item, index) in relatedOutcomes" :key="index" class="related-item">
                        <div class="related-title">{{ item.title }}</div>
                        <div class="related-authors">{{ item.authors }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 评论区 -->
                <div class="down-container">
                  <div class="section-title">评论区</div>
                  <div class="comments-container">
                    <el-empty description="暂无评论" />
                    <!-- 添加评论功能可以在此实现 -->
                  </div>
                </div>
              </div>
              <div v-else class="error-container">
                <el-empty description="未找到该研究成果或加载失败"></el-empty>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="side-container">
              <!-- 侧边栏信息 -->
              <div class="side-panel">
                <div class="panel-section">
                  <div class="section-title">成果信息</div>
                  <div v-if="outcomeData" class="info-list">
                    <div class="info-item">
                      <div class="info-label">类型</div>
                      <div class="info-value">{{ formatType(outcomeData.type) }}</div>
                    </div>
                    <div class="info-item" v-if="outcomeData.publishDate">
                      <div class="info-label">年份</div>
                      <div class="info-value">{{ new Date(outcomeData.publishDate).getFullYear() }}</div>
                    </div>
                    <div class="info-item" v-if="outcomeData.journal">
                      <div class="info-label">期刊</div>
                      <div class="info-value">{{ outcomeData.journal }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 作者信息区 -->
                <div class="panel-section">
                  <div class="section-title">作者信息</div>
                  <div v-if="outcomeData && outcomeData.authors" class="authors-list">
                    <div v-for="(author, index) in authorList" :key="index" class="author-item">
                      <div class="author-name">{{ author }}</div>
                    </div>
                  </div>
                  <el-empty v-else description="暂无作者信息" />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-container>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getResearchOutcomeById, uploadResearchFile, ResearchOutcomeVO } from '@/api/outcome';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'OutcomeDetail',
  
  setup() {
    const route = useRoute();
    const loading = ref(true);
    const outcomeData = ref<ResearchOutcomeVO | null>(null);
    const relatedOutcomes = ref<any[]>([]);
    
    // 文件上传相关
    const uploadDialogVisible = ref(false);
    const fileList = ref<any[]>([]);
    const selectedFile = ref<File | null>(null);
    const uploading = ref(false);
    
    // 从路由参数获取ID
    const outcomeId = computed(() => {
      return route.params.id ? route.params.id.toString() : null;
    });
    
    // 解析作者列表
    const authorList = computed(() => {
      if (!outcomeData.value || !outcomeData.value.authors) return [];
      return outcomeData.value.authors.split(',').map(author => author.trim());
    });
    
    // 格式化卷期信息
    const formatVolumeIssue = (outcome: ResearchOutcomeVO) => {
      if (outcome.volume && outcome.issue) {
        return `卷 ${outcome.volume}, 期 ${outcome.issue}`;
      } else if (outcome.volume) {
        return `卷 ${outcome.volume}`;
      } else if (outcome.issue) {
        return `期 ${outcome.issue}`;
      }
      return '';
    };
    
    // 格式化日期
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } catch (e) {
        return dateStr;
      }
    };
    
    // 格式化成果类型
    const formatType = (type: string) => {
      const typeMap: {[key: string]: string} = {
        'article': '论文',
        'journal': '期刊',
        'conference': '会议',
        'patent': '专利',
        'book': '书籍',
        'chapter': '章节'
      };
      
      return typeMap[type] || type;
    };
    
    // 打开URL
    const openUrl = (url: string) => {
      if (url) {
        window.open(url, '_blank');
      }
    };
    
    // 加载研究成果数据
    const loadOutcomeData = async () => {
      loading.value = true;
      console.log(outcomeId.value);
      try {
        if (outcomeId.value) {
          // 有ID，从后端获取数据
          const data = await getResearchOutcomeById(Number(outcomeId.value));
          if (data) {
            outcomeData.value = data;
            // 这里可以添加获取相关成果的逻辑
            loadRelatedOutcomes(data);
          } else {
            ElMessage.error('获取研究成果信息失败');
          }
        } else {
          // 无ID，使用静态数据
          outcomeData.value = {
            outcomeId: 1,
            type: 'article',
            title: '人工智能在医疗健康领域的应用与挑战',
            authors: '张三, 李四, 王五',
            journal: '中国医学科学杂志',
            volume: 42,
            issue: 3,
            pages: 156,
            publishDate: '2023-05-15',
            doi: '10.1234/cmj.2023.03.042',
            url: 'https://example.com/article/42/3/156',
            patentNumber: ''
          };
          
          // 添加静态相关成果
          relatedOutcomes.value = [
            {
              title: '基于深度学习的医学影像分析技术研究进展',
              authors: '李四, 赵六, 钱七'
            },
            {
              title: '医疗健康大数据分析:机遇与挑战',
              authors: '王五, 张三, 孙八'
            }
          ];
        }
      } catch (error) {
        console.error('加载研究成果数据失败:', error);
        ElMessage.error('加载研究成果数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载相关成果
    const loadRelatedOutcomes = (outcome: ResearchOutcomeVO) => {
      // 这里可以添加从后端获取相关成果的逻辑
      // 暂时使用静态数据
      relatedOutcomes.value = [
        {
          title: '相关研究成果1',
          authors: '相关作者1, 相关作者2'
        },
        {
          title: '相关研究成果2',
          authors: '相关作者3, 相关作者4'
        }
      ];
    };
    
    // 显示上传对话框
    const showUploadDialog = () => {
      uploadDialogVisible.value = true;
      fileList.value = [];
      selectedFile.value = null;
    };
    
    // 处理文件选择变化
    const handleFileChange = (file: any) => {
      if (file && file.raw) {
        // 检查是否为PDF文件
        if (file.raw.type !== 'application/pdf') {
          ElMessage.warning('只能上传PDF文件');
          return false;
        }
        selectedFile.value = file.raw;
      } else {
        selectedFile.value = null;
      }
    };
    
    // 上传文件
    const uploadFile = async () => {
      if (!selectedFile.value) {
        ElMessage.warning('请先选择要上传的文件');
        return;
      }
      
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID，上传失败');
        return;
      }
      
      uploading.value = true;
      try {
        const result = await uploadResearchFile(outcomeData.value.outcomeId, selectedFile.value);
        if (result) {
          ElMessage.success('文件上传成功');
          uploadDialogVisible.value = false;
          // 可以刷新成果信息
          await loadOutcomeData();
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        ElMessage.error('上传文件失败');
      } finally {
        uploading.value = false;
      }
    };
    
    // 页面加载时获取数据
    onMounted(() => {
      loadOutcomeData();
    });
    
    return {
      loading,
      outcomeData,
      relatedOutcomes,
      authorList,
      formatVolumeIssue,
      formatDate,
      formatType,
      openUrl,
      // 文件上传相关
      uploadDialogVisible,
      fileList,
      selectedFile,
      uploading,
      showUploadDialog,
      handleFileChange,
      uploadFile
    };
  }
});
</script>

<style scoped>
.bg-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  z-index: -2;
}

.bg-strong-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 300px;
  background: linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%);
  z-index: -1;
}

.main-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 32px 32px 24px 32px;
  margin-bottom: 24px;
}

.loading-container {
  padding: 20px;
}

.header-container {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.header-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  line-height: 1.3;
}

.info-container {
  margin-bottom: 20px;
}

.detail-info {
  margin-bottom: 8px;
  font-size: 15px;
  display: flex;
}

.info-label {
  color: #888;
  min-width: 80px;
  font-weight: 500;
}

.action-container {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.down-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.related-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.related-item:hover {
  background: #eef2f8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.related-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.related-authors {
  font-size: 14px;
  color: #666;
}

.side-container {
  margin-left: 24px;
}

.side-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.panel-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-section:last-child {
  border-bottom: none;
}

.info-list, .authors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .info-label {
  font-size: 14px;
  color: #888;
  min-width: auto;
}

.info-value {
  font-size: 16px;
  color: #333;
}

.author-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.author-name {
  font-size: 15px;
  color: #333;
}

.doi-link {
  color: #1890ff;
  text-decoration: none;
}

.doi-link:hover {
  text-decoration: underline;
}

.error-container {
  padding: 40px 0;
  text-align: center;
}

/* 文件上传相关样式 */
.upload-container {
  padding: 10px 0;
}

.upload-tip {
  margin-bottom: 15px;
  color: #606266;
  font-size: 14px;
}

.pdf-uploader {
  width: 100%;
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style> 