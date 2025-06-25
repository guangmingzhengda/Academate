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
                <!-- 成果信息 -->
                <div class="outcome-content">
                  <div class="outcome-title">{{ outcomeData ? outcomeData.title : '成果标题' }}</div>
                  
                  <!-- 作者、日期、期刊等信息 -->
                  <div class="outcome-meta">
                    <div v-if="outcomeData">
                      <span class="meta-item">作者: {{ outcomeData.authors }}</span>
                      <span class="meta-item" v-if="outcomeData.publishDate">发表日期: {{ formatDate(outcomeData.publishDate) }}</span>
                      <span class="meta-item" v-if="outcomeData.journal">期刊: {{ outcomeData.journal }}</span>
                      <span class="meta-item" v-if="outcomeData.volume">卷号: {{ outcomeData.volume }}</span>
                      <span class="meta-item" v-if="outcomeData.issue">期号: {{ outcomeData.issue }}</span>
                      <span class="meta-item" v-if="outcomeData.pages">页码: {{ outcomeData.pages }}</span>
                      <span class="meta-item" v-if="outcomeData.doi">DOI: {{ outcomeData.doi }}</span>
                      <span class="meta-item" v-if="outcomeData.category">分类: {{ outcomeData.category }}</span>
                    </div>
                    <div v-else>
                      <!-- 占位内容 -->
                      <span class="meta-item">作者: 默认作者</span>
                      <span class="meta-item">发表日期: 2023-01-01</span>
                      <span class="meta-item">期刊: 示例期刊</span>
                    </div>
                  </div>
                  
                  <!-- 摘要内容 -->
                  <div class="outcome-section">
                    <div class="section-header">摘要</div>
                    <div class="abstract-content">
                      {{ outcomeData && outcomeData.abstractContent ? outcomeData.abstractContent : '暂无摘要内容' }}
                    </div>
                  </div>
                  
                  <!-- 关键词 (基于分类字段) -->
                  <div class="outcome-section" v-if="outcomeData && outcomeData.category">
                    <div class="section-header">关键词</div>
                    <div class="keywords-list">
                      <el-tag v-for="(keyword, index) in categoryList" :key="index" size="small" class="keyword-tag">
                        {{ keyword }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <!-- 引用格式 -->
                  <div class="outcome-section">
                    <div class="section-header">引用格式</div>
                    <div class="citation-formats">
                      <div class="citation-format">
                        <div class="format-label">MLA格式</div>
                        <div class="format-content">
                          {{ formatGBTCitation() }}
                        </div>
                      </div>
                      <div class="citation-format">
                        <div class="format-label">APA格式</div>
                        <div class="format-content">
                          {{ formatGBTCitation() }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 链接区 -->
                  <div class="outcome-section">
                    <div class="section-header">链接</div>
                    <div class="links-list">
                      <div v-if="outcomeData && outcomeData.url" class="link-item">
                        <span class="link-label">原文链接:</span>
                        <a :href="outcomeData.url" target="_blank" class="link-url">{{ outcomeData.url }}</a>
                      </div>
                      <div v-if="outcomeData && outcomeData.pdfUrl" class="link-item">
                        <span class="link-label">PDF下载:</span>
                        <a :href="outcomeData.pdfUrl" target="_blank" class="link-url">下载</a>
                      </div>
                      <div v-if="outcomeData && outcomeData.arxivId" class="link-item">
                        <span class="link-label">arXiv:</span>
                        <a :href="'https://arxiv.org/abs/' + outcomeData.arxivId" target="_blank" class="link-url">{{ outcomeData.arxivId }}</a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 评论区 -->
                <div class="comments-container">
                  <div class="section-title">评论区</div>
                  
                  <!-- 评论输入框 -->
                  <div class="comment-input-container">
                    <el-avatar :size="40" :src="currentUserAvatar" v-if="currentUserAvatar"></el-avatar>
                    <el-avatar :size="40" icon="el-icon-user" v-else></el-avatar>
                    <div class="comment-input-wrapper">
                      <textarea
                        v-model="commentText"
                        class="comment-textarea"
                        rows="3"
                        placeholder="添加您的评论..."
                      ></textarea>
                      <div class="comment-actions">
                        <el-button 
                          type="primary" 
                          @click="submitComment" 
                          :disabled="!commentText" 
                          :loading="submittingComment"
                        >
                          发表评论
                        </el-button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 评论列表 -->
                  <div class="comment-list" v-loading="loadingComments">
                    <!-- 无评论时显示提示 -->
                    <div class="empty-comment" v-if="!loadingComments && (!comments || comments.length === 0)">
                      <el-empty description="暂无评论，快来发表第一条评论吧！"></el-empty>
                    </div>
                    
                    <!-- 评论列表内容 -->
                    <div v-else class="comment-items">
                      <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
                        <!-- 一级评论 -->
                        <div class="comment-header">
                          <div class="comment-user">
                            <el-avatar :size="40" :src="comment.userAvatar" v-if="comment.userAvatar"></el-avatar>
                            <el-avatar :size="40" icon="el-icon-user" v-else></el-avatar>
                            <div class="user-info">
                              <div class="username">{{ comment.userAccount }}</div>
                              <div class="comment-time">{{ formatCommentTime(comment.commentedAt) }}</div>
                            </div>
                          </div>
                          <div class="comment-actions">
                            <el-button 
                              type="text" 
                              @click="replyToComment(comment)" 
                            >
                              回复
                            </el-button>
                          </div>
                        </div>
                        <div class="comment-content">
                          {{ comment.comment }}
                        </div>
                        
                        <!-- 回复输入框 -->
                        <div class="reply-input-container" v-if="replyingToId === comment.commentId">
                          <textarea
                            v-model="replyText"
                            class="reply-textarea"
                            rows="2"
                            placeholder="回复评论..."
                          ></textarea>
                          <div class="reply-actions">
                            <el-button size="small" @click="cancelReply">取消</el-button>
                            <el-button 
                              type="primary" 
                              size="small" 
                              @click="submitReply(comment.commentId)" 
                              :disabled="!replyText" 
                              :loading="submittingReply"
                            >
                              回复
                            </el-button>
                          </div>
                        </div>
                        
                        <!-- 二级评论 -->
                        <div class="reply-list" v-if="comment.children && comment.children.length > 0">
                          <div v-for="reply in comment.children" :key="reply.commentId" class="reply-item">
                            <div class="reply-header">
                              <div class="reply-user">
                                <el-avatar :size="30" :src="reply.userAvatar" v-if="reply.userAvatar"></el-avatar>
                                <el-avatar :size="30" icon="el-icon-user" v-else></el-avatar>
                                <div class="user-info">
                                  <div class="username">{{ reply.userAccount }}</div>
                                  <div class="comment-time">{{ formatCommentTime(reply.commentedAt) }}</div>
                                </div>
                              </div>
                            </div>
                            <div class="reply-content">
                              {{ reply.comment }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 分页 -->
                    <div class="pagination-container" v-if="totalComments > pageSize">
                      <el-pagination
                        background
                        layout="prev, pager, next"
                        :total="totalComments"
                        :page-size="pageSize"
                        :current-page="currentPage"
                        @current-change="handlePageChange"
                      ></el-pagination>
                    </div>
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
                    <div class="info-item" v-if="outcomeData.category">
                      <div class="info-label">分类</div>
                      <div class="info-value">{{ outcomeData.category }}</div>
                    </div>
                    <div class="info-item" v-if="outcomeData.status">
                      <div class="info-label">状态</div>
                      <div class="info-value">{{ outcomeData.status }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 作者信息区 -->
                <div class="panel-section">
                  <div class="section-title">作者信息</div>
                  
                  <!-- 有作者列表时显示第一个作者的详细信息 -->
                  <div v-if="outcomeData && outcomeData.authorList && outcomeData.authorList.length > 0" class="authors-list">
                    <div class="author-item main-author">
                      <div class="author-avatar">
                        <el-avatar :size="60" :src="outcomeData.authorList[0].avatar" v-if="outcomeData.authorList[0].avatar"></el-avatar>
                        <el-avatar :size="60" icon="el-icon-user" v-else></el-avatar>
                      </div>
                      <div class="author-name">{{ outcomeData.authorList[0].name || outcomeData.authorList[0].account }}</div>
                      <div class="author-info" v-if="outcomeData.authorList[0].institution">
                        <div class="info-label">机构:</div>
                        <div>{{ outcomeData.authorList[0].institution }}</div>
                      </div>
                      <div class="author-info" v-if="outcomeData.authorList[0].department">
                        <div class="info-label">院系:</div>
                        <div>{{ outcomeData.authorList[0].department }}</div>
                      </div>
                      <div class="author-info" v-if="outcomeData.authorList[0].jobTitle">
                        <div class="info-label">职称:</div>
                        <div>{{ outcomeData.authorList[0].jobTitle }}</div>
                      </div>
                      <div class="author-info" v-if="outcomeData.authorList[0].field">
                        <div class="info-label">研究领域:</div>
                        <div>{{ outcomeData.authorList[0].field }}</div>
                      </div>
                    </div>
                    
                    <!-- 显示其他作者名字列表 -->
                    <div class="other-authors" v-if="outcomeData.authorList.length > 1">
                      <div class="section-subtitle">其他作者</div>
                      <div v-for="(author, index) in outcomeData.authorList.slice(1)" :key="index" class="other-author-item">
                        {{ author.name || author.account }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- 无作者列表时使用静态数据 -->
                  <div v-else class="authors-list">
                    <div class="author-item">
                      <div class="author-name">张三</div>
                      <div class="author-info">北京大学计算机科学与技术学院</div>
                    </div>
                    <div class="author-item">
                      <div class="author-name">李四</div>
                      <div class="author-info">清华大学人工智能研究院</div>
                    </div>
                    <div class="author-item">
                      <div class="author-name">王五</div>
                      <div class="author-info">中国科学院计算技术研究所</div>
                    </div>
                  </div>
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
import { getResearchOutcomeById, uploadResearchFile, ResearchOutcomeVO, getOutcomeComments, sendOutcomeComment, CommentVO } from '@/api/outcome';
import { ElMessage } from 'element-plus';
import store from '@/store';

export default defineComponent({
  name: 'OutcomeDetail',
  
  setup() {
    const route = useRoute();
    const loading = ref(true);
    const outcomeData = ref<ResearchOutcomeVO | null>(null);
    
    // 文件上传相关
    const uploadDialogVisible = ref(false);
    const fileList = ref<any[]>([]);
    const selectedFile = ref<File | null>(null);
    const uploading = ref(false);
    
    // 评论相关
    const comments = ref<CommentVO[]>([]);
    const loadingComments = ref(false);
    const commentText = ref('');
    const replyText = ref('');
    const replyingToId = ref<number | null>(null);
    const submittingComment = ref(false);
    const submittingReply = ref(false);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalComments = ref(0);
    
    // 获取当前用户信息
    const currentUserId = computed(() => store.state.userId || null);
    const currentUserAvatar = computed(() => store.state.userAvatar || '');
    
    // 从路由参数获取ID
    const outcomeId = computed(() => {
      return route.params.id ? route.params.id.toString() : null;
    });
    
    // 解析作者列表
    const authorList = computed(() => {
      if (!outcomeData.value || !outcomeData.value.authors) return [];
      return outcomeData.value.authors.split(',').map(author => author.trim());
    });
    
    // 解析分类/关键词列表
    const categoryList = computed(() => {
      if (!outcomeData.value || !outcomeData.value.category) return [];
      return outcomeData.value.category.split('、').map(keyword => keyword.trim());
    });
    
    // 格式化评论时间
    const formatCommentTime = (dateStr: string) => {
      if (!dateStr) return '';
      
      const now = new Date();
      const commentDate = new Date(dateStr);
      const diffMs = now.getTime() - commentDate.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      
      if (diffSec < 60) {
        return '刚刚';
      } else if (diffSec < 3600) {
        return `${Math.floor(diffSec / 60)}分钟前`;
      } else if (diffSec < 86400) {
        return `${Math.floor(diffSec / 3600)}小时前`;
      } else if (diffSec < 604800) {
        return `${Math.floor(diffSec / 86400)}天前`;
      } else {
        return formatDate(dateStr);
      }
    };
    
    // 加载评论列表
    const loadComments = async () => {
      if (!outcomeId.value) return;
      
      loadingComments.value = true;
      try {
        const result = await getOutcomeComments(Number(outcomeId.value));
        if (result) {
          comments.value = result;
          totalComments.value = result.length;
        } else {
          comments.value = [];
          totalComments.value = 0;
        }
      } catch (error) {
        console.error('加载评论失败:', error);
        ElMessage.error('加载评论失败');
      } finally {
        loadingComments.value = false;
      }
    };
    
    // 提交评论
    const submitComment = async () => {
      console.log('===== 调试评论问题 =====');
      console.log('提交评论原始内容:', commentText.value);
      console.log('评论内容类型:', typeof commentText.value);
      console.log('评论内容长度:', commentText.value ? commentText.value.length : 0);
      console.log('评论trim后长度:', commentText.value ? commentText.value.trim().length : 0);
      
      if (!commentText.value || !commentText.value.trim()) {
        ElMessage.warning('评论内容不能为空');
        return;
      }
      
      if (!outcomeId.value) {
        ElMessage.error('无法获取成果ID');
        return;
      }
      
      // 明确指定这是一级评论，不设置parentCommentId
      const commentData = {
        outcomeId: Number(outcomeId.value),
        commentText: commentText.value.trim()
        // 一级评论不需要parentCommentId
      };
      
      console.log('准备发送评论数据:', commentData);
      
      submittingComment.value = true;
      try {
        const result = await sendOutcomeComment(commentData);
        console.log('评论发送结果:', result);
        
        if (result) {
          ElMessage.success('评论发布成功');
          commentText.value = '';
          await loadComments(); // 重新加载评论列表
        }
      } catch (error) {
        console.error('发布评论失败:', error);
        ElMessage.error('发布评论失败');
      } finally {
        submittingComment.value = false;
      }
    };
    
    // 回复评论
    const replyToComment = (comment: CommentVO) => {
      replyingToId.value = comment.commentId;
      replyText.value = '';
    };
    
    // 取消回复
    const cancelReply = () => {
      replyingToId.value = null;
      replyText.value = '';
    };
    
    // 提交回复
    const submitReply = async (parentId: number) => {
      console.log('提交回复:', replyText.value);
      console.log('回复内容长度:', replyText.value ? replyText.value.length : 0);
      console.log('回复trim后长度:', replyText.value ? replyText.value.trim().length : 0);
      console.log('父评论ID:', parentId); // 打印父评论ID，确保正确
      
      if (!replyText.value || !replyText.value.trim()) {
        ElMessage.warning('回复内容不能为空');
        return;
      }
      
      if (!outcomeId.value) {
        ElMessage.error('无法获取成果ID');
        return;
      }
      
      // 明确指定这是二级评论，设置parentCommentId
      const replyData = {
        outcomeId: Number(outcomeId.value),
        commentText: replyText.value.trim(),
        parentCommentId: parentId // 二级评论需要设置父评论ID
      };
      
      console.log('准备发送回复数据:', replyData);
      
      submittingReply.value = true;
      try {
        const result = await sendOutcomeComment(replyData);
        console.log('回复发送结果:', result);
        
        if (result) {
          ElMessage.success('回复发布成功');
          replyText.value = '';
          replyingToId.value = null;
          await loadComments(); // 重新加载评论列表
        }
      } catch (error) {
        console.error('发布回复失败:', error);
        ElMessage.error('发布回复失败');
      } finally {
        submittingReply.value = false;
      }
    };
    
    // 处理分页
    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };
    
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
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.getFullYear() + '-' + 
             String(date.getMonth() + 1).padStart(2, '0') + '-' + 
             String(date.getDate()).padStart(2, '0');
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
            patentNumber: '',
            arxivId: '2305.12345',
            abstractContent: '本文综述了人工智能技术在医疗健康领域的最新应用进展，分析了面临的挑战与机遇，并对未来发展趋势进行了展望。重点讨论了深度学习、自然语言处理、计算机视觉等技术在疾病诊断、医学影像分析、药物研发、健康管理等方面的应用案例与效果评估。',
            category: '人工智能、医疗健康',
            pdfUrl: '',
            status: '已发表',
            createTime: '2023-04-10T10:00:00',
            updateTime: '2023-05-20T14:30:00'
          };
        }
      } catch (error) {
        console.error('加载研究成果数据失败:', error);
        ElMessage.error('加载研究成果数据失败');
      } finally {
        loading.value = false;
      }
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
    
    // 生成APA引用格式
    const generateAPACitation = () => {
      if (!outcomeData.value) return '暂无信息';
      
      let citation = '';
      const authors = outcomeData.value.authors ? outcomeData.value.authors.split(',') : [];
      
      // 作者部分
      if (authors.length > 0) {
        authors.forEach((author, index) => {
          author = author.trim();
          const nameParts = author.split(' ');
          
          if (nameParts.length > 1) {
            // 姓氏, 名字首字母.
            citation += nameParts[nameParts.length - 1] + ', ';
            
            // 添加名字首字母
            for (let i = 0; i < nameParts.length - 1; i++) {
              citation += nameParts[i].charAt(0) + '. ';
            }
          } else {
            citation += author + ' ';
          }
          
          // 添加分隔符
          if (index < authors.length - 2) {
            citation += ', ';
          } else if (index === authors.length - 2) {
            citation += '& ';
          }
        });
        citation += '(' + (outcomeData.value.publishDate ? new Date(outcomeData.value.publishDate).getFullYear() : '') + '). ';
      }
      
      // 标题部分
      if (outcomeData.value.title) {
        citation += outcomeData.value.title + '. ';
      }
      
      // 期刊名（斜体，这里用普通文本表示）
      if (outcomeData.value.journal) {
        citation += outcomeData.value.journal;
        
        // 卷号（斜体）
        if (outcomeData.value.volume) {
          citation += ', ' + outcomeData.value.volume;
        }
        
        // 期号（括号中）
        if (outcomeData.value.issue) {
          citation += '(' + outcomeData.value.issue + ')';
        }
        
        // 页码
        if (outcomeData.value.pages) {
          citation += ', ' + outcomeData.value.pages;
        }
        
        citation += '. ';
      }
      
      // DOI
      if (outcomeData.value.doi) {
        citation += 'https://doi.org/' + outcomeData.value.doi;
      }
      
      return citation || '暂无信息';
    };

    // MLA引用格式
    const generateMLACitation = () => {
      if (!outcomeData.value) return '暂无信息';
      
      let citation = '';
      const authors = outcomeData.value.authors ? outcomeData.value.authors.split(',') : [];
      
      // 作者部分
      if (authors.length > 0) {
        // MLA格式第一个作者姓氏在前
        const firstAuthor = authors[0].trim();
        const nameParts = firstAuthor.split(' ');
        if (nameParts.length > 1) {
          citation += nameParts[nameParts.length - 1] + ', ' + nameParts.slice(0, nameParts.length - 1).join(' ');
        } else {
          citation += firstAuthor;
        }
        
        // 添加其他作者
        if (authors.length > 1) {
          citation += ', et al';
        }
        citation += '. ';
      }
      
      // 标题部分（加引号）
      if (outcomeData.value.title) {
        citation += `"${outcomeData.value.title}." `;
      }
      
      // 期刊名（斜体，这里用普通文本表示）
      if (outcomeData.value.journal) {
        citation += outcomeData.value.journal + ', ';
      }
      
      // 卷期信息
      if (outcomeData.value.volume) {
        citation += 'vol. ' + outcomeData.value.volume + ', ';
      }
      
      if (outcomeData.value.issue) {
        citation += 'no. ' + outcomeData.value.issue + ', ';
      }
      
      // 日期
      if (outcomeData.value.publishDate) {
        const date = new Date(outcomeData.value.publishDate);
        citation += date.getFullYear() + ', ';
      }
      
      // 页码
      if (outcomeData.value.pages) {
        citation += 'pp. ' + outcomeData.value.pages + '. ';
      }
      
      // DOI
      if (outcomeData.value.doi) {
        citation += 'DOI: ' + outcomeData.value.doi + '.';
      }
      
      return citation || '暂无信息';
    };

    // GB/T 7714引用格式
    const formatGBTCitation = () => {
      if (!outcomeData.value) return '';
      
      const data = outcomeData.value;
      const authors = data.authors ? formatAuthorsGBT(data.authors) : '';
      const title = data.title || '';
      const journal = data.journal ? `${data.journal}` : '';
      const year = data.publishDate ? new Date(data.publishDate).getFullYear() : '';
      const volume = data.volume ? `${data.volume}` : '';
      const issue = data.issue ? `(${data.issue})` : '';
      const pages = data.pages ? `${data.pages}` : '';
      
      return `${authors}. ${title}[J]. ${journal}, ${year}${volume ? `, ${volume}` : ''}${issue}${pages ? `: ${pages}` : ''}.`;
    };

    // 格式化APA风格的作者列表
    const formatAuthorsApa = (authorStr: string) => {
      const authorList = authorStr.split(',').map(author => author.trim());
      if (authorList.length === 0) return '';
      if (authorList.length === 1) return authorList[0];
      
      const lastAuthor = authorList.pop();
      return `${authorList.join(', ')}, & ${lastAuthor}`;
    };

    // 格式化MLA风格的作者列表
    const formatAuthorsMla = (authorStr: string) => {
      const authorList = authorStr.split(',').map(author => author.trim());
      if (authorList.length === 0) return '';
      if (authorList.length === 1) return authorList[0];
      
      // 第一个作者姓名反转
      const firstAuthor = authorList[0].split(' ');
      if (firstAuthor.length > 1) {
        const lastName = firstAuthor.pop();
        authorList[0] = `${lastName}, ${firstAuthor.join(' ')}`;
      }
      
      if (authorList.length === 2) return `${authorList[0]} and ${authorList[1]}`;
      
      return `${authorList[0]}, et al`;
    };

    // 格式化GB/T 7714风格的作者列表
    const formatAuthorsGBT = (authorStr: string) => {
      const authorList = authorStr.split(',').map(author => author.trim());
      if (authorList.length === 0) return '';
      if (authorList.length <= 3) return authorList.join(', ');
      
      return `${authorList[0]}, ${authorList[1]}, ${authorList[2]}, et al`;
    };
    
    // 页面加载时获取数据
    onMounted(() => {
      loadOutcomeData();
      loadComments();
    });
    
    return {
      loading,
      outcomeData,
      authorList,
      categoryList,
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
      uploadFile,
      formatGBTCitation,
      // 评论相关
      comments,
      loadingComments,
      commentText,
      replyText,
      replyingToId,
      submittingComment,
      submittingReply,
      currentPage,
      pageSize,
      totalComments,
      currentUserAvatar,
      formatCommentTime,
      submitComment,
      replyToComment,
      cancelReply,
      submitReply,
      handlePageChange
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
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.author-info {
  font-size: 14px;
  color: #666;
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

.abstract-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.abstract-content {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  text-align: justify;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.abstract-content.empty-abstract {
  color: #909399;
  font-size: 14px;
  text-align: center;
}

/* 关键词相关样式 */
.keywords-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.keywords-content {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  text-align: justify;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.keywords-content.empty-keywords {
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 引用格式相关样式 */
.citation-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.citation-content {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  text-align: justify;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.citation-item {
  margin-bottom: 12px;
}

.citation-type {
  font-size: 14px;
  font-weight: 500;
  color: #888;
  margin-bottom: 4px;
}

.citation-text {
  font-size: 16px;
  color: #333;
}

/* 评论区相关样式 */
.comments-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.comment-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
}

.comment-input-wrapper {
  flex: 1;
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.login-tip {
  color: #909399;
  font-size: 14px;
}

.comment-list {
  margin-top: 16px;
}

.empty-comment {
  padding: 16px;
  text-align: center;
}

.comment-items {
  margin-top: 16px;
}

.comment-item {
  margin-bottom: 16px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 14px;
  color: #909399;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.comment-content {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.reply-input-container {
  margin-top: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.reply-list {
  margin-top: 8px;
}

.reply-item {
  margin-bottom: 8px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-content {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.pagination-container {
  margin-top: 16px;
  text-align: right;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  box-sizing: border-box;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.comment-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.reply-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  box-sizing: border-box;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.reply-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.outcome-content {
  margin-bottom: 24px;
}

.outcome-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  line-height: 1.3;
  color: #333;
}

.outcome-meta {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.meta-item {
  margin-right: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.outcome-section {
  margin-bottom: 24px;
}

.section-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.abstract-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  text-align: justify;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin-right: 8px;
}

.citation-formats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.citation-format {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #1890ff;
}

.format-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.format-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-item {
  display: flex;
  align-items: center;
}

.link-label {
  min-width: 100px;
  font-weight: 500;
  color: #666;
}

.link-url {
  color: #1890ff;
  text-decoration: none;
  word-break: break-all;
}

.link-url:hover {
  text-decoration: underline;
}

.main-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  text-align: center;
  border-bottom: 1px dashed #f0f0f0;
}

.author-avatar {
  margin-bottom: 12px;
}

.author-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.author-info {
  display: flex;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.info-label {
  margin-right: 8px;
  color: #888;
  font-weight: 500;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 500;
  margin: 16px 0 12px;
  color: #666;
}

.other-authors {
  padding-top: 12px;
}

.other-author-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 14px;
}
</style> 