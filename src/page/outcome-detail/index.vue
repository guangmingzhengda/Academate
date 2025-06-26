<template>
  <div class="bg-container"/>
  
  <div class="view-set-margin">
    <div class="outcome-detail-container">
      <div class="outcome-content">
        
        <!-- 主要内容区域 -->
        <div class="main-content">
          <!-- 左侧成果详情 -->
          <div class="content-left">
            <!-- 成果标题卡片 -->
            <div class="section-card title-card">
              <div v-if="loading" class="loading-container">
                <el-skeleton :rows="5" animated />
              </div>
              <div v-else-if="outcomeData" class="card-content">
                <div class="outcome-header">
                  <div class="meta-tags">
                    <span class="type-tag" :class="outcomeData.type">
                      {{ formatType(outcomeData.type) }}
                    </span>
                    <span v-if="outcomeData.status" class="status-tag">
                      {{ outcomeData.status }}
                    </span>
                  </div>
                  <div class="outcome-title">{{ outcomeData.title || '成果标题' }}</div>
                  
                  <!-- 编辑按钮 (只有成果所有者才能看到) -->
                  <div class="edit-actions" v-if="outcomeData.isMine">
                    <el-button type="primary" size="small" @click="showEditDialog" style="margin-right: 10px;">
                      ✏️ 编辑
                    </el-button>
                    <el-button type="success" size="small" @click="showUploadDialog">
                      📤 上传全文
                    </el-button>
                  </div>
                </div>
                
                <!-- 元数据信息 -->
                <div class="outcome-meta">
                  <div class="meta-info">
                    <div class="meta-row">
                      <span class="meta-label">作者：</span>
                      <span class="meta-value">{{ outcomeData.authors || '未知' }}</span>
                    </div>
                    <div class="meta-row" v-if="outcomeData.publishDate">
                      <span class="meta-label">发表日期：</span>
                      <span class="meta-value">{{ formatDate(outcomeData.publishDate) }}</span>
                    </div>
                    <div class="meta-row" v-if="outcomeData.journal">
                      <span class="meta-label">期刊：</span>
                      <span class="meta-value">{{ outcomeData.journal }}</span>
                    </div>
                    <div class="meta-row" v-if="outcomeData.doi">
                      <span class="meta-label">DOI：</span>
                      <span class="meta-value">{{ outcomeData.doi }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 点赞按钮 (放在卡片左下角) -->
                <div class="like-section-bottom">
                  <el-button 
                    :type="isLiked ? 'danger' : 'default'" 
                    size="small" 
                    @click="toggleLike"
                    :loading="likingInProgress"
                    plain
                  >
                    {{ isLiked ? `❤️ 已点赞 (${likeCount})` : `🤍 点赞 (${likeCount})` }}
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 摘要卡片 -->
            <div class="section-card abstract-card" v-if="outcomeData">
              <div class="card-header">
                <h3>摘要</h3>
              </div>
              <div class="card-content">
                <div class="abstract-content">
                  {{ outcomeData.abstractContent || '暂无摘要内容' }}
                </div>
              </div>
            </div>
            
            <!-- 关键词卡片 -->
            <div class="section-card keywords-card" v-if="outcomeData && outcomeData.category">
              <div class="card-header">
                <h3>关键词</h3>
              </div>
              <div class="card-content">
                <div class="keywords-list">
                  <el-tag v-for="(keyword, index) in categoryList" :key="index" size="small" class="keyword-tag">
                    {{ keyword }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <!-- 链接卡片 -->
            <div class="section-card links-card" v-if="outcomeData && (outcomeData.url || outcomeData.pdfUrl || outcomeData.arxivId)">
              <div class="card-header">
                <h3>相关链接</h3>
              </div>
              <div class="card-content">
                <div class="links-list">
                  <div v-if="outcomeData.url" class="link-item">
                    <span class="link-label">原文链接</span>
                    <el-button type="primary" size="small" @click="openUrl(outcomeData.url)" plain>
                      🔗 访问原文
                    </el-button>
                  </div>
                  <div v-if="outcomeData.pdfUrl" class="link-item">
                    <span class="link-label">PDF全文</span>
                    <el-button type="danger" size="small" @click="openUrl(outcomeData.pdfUrl)" plain>
                      📄 下载原文
                    </el-button>
                  </div>
                  <div v-if="outcomeData.arxivId" class="link-item">
                    <span class="link-label">arXiv</span>
                    <el-button type="success" size="small" @click="openUrl('https://arxiv.org/abs/' + outcomeData.arxivId)" plain>
                      📚 访问arXiv
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 评论区卡片 -->
            <div class="section-card comments-card">
              <div class="card-header">
                <h3>评论区</h3>
                <span class="comment-count">({{ totalComments }})</span>
              </div>
              <div class="card-content">
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
                        size="small"
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
                    <el-empty description="暂无评论，快来发表第一条评论吧！" :image-size="60"></el-empty>
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
                            size="small"
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
                      small
                    ></el-pagination>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右侧侧边栏 -->
          <div class="content-right">
            <!-- 成果信息卡片 -->
            <div class="section-card info-sidebar-card">
              <div class="card-header">
                <h3>成果信息</h3>
              </div>
              <div v-if="outcomeData" class="card-content">
                <div class="info-list">
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
            </div>
            
            <!-- 作者信息卡片 -->
            <div class="section-card author-sidebar-card">
              <div class="card-header">
                <h3>作者信息</h3>
              </div>
              <div class="card-content">
                <!-- 有作者列表时显示详细信息 -->
                <div v-if="outcomeData && outcomeData.authorList && outcomeData.authorList.length > 0" class="authors-list">
                  <div class="author-item main-author">
                    <!-- 有ID时显示可点击头像 -->
                    <router-link 
                      v-if="outcomeData.authorList[0].id"
                      :to="`/profile/${outcomeData.authorList[0].id}`" 
                      class="author-avatar-link"
                      style="text-decoration: none;"
                    >
                      <div class="author-avatar">
                        <el-avatar :size="60" :src="outcomeData.authorList[0].avatar" v-if="outcomeData.authorList[0].avatar"></el-avatar>
                        <el-avatar :size="60" icon="el-icon-user" v-else></el-avatar>
                      </div>
                    </router-link>
                    <!-- 没有ID时显示普通头像 -->
                    <div v-else class="author-avatar">
                      <el-avatar :size="60" :src="outcomeData.authorList[0].avatar" v-if="outcomeData.authorList[0].avatar"></el-avatar>
                      <el-avatar :size="60" icon="el-icon-user" v-else></el-avatar>
                    </div>
                    
                    <div class="author-details">
                      <!-- 有ID时显示可点击名字 -->
                      <router-link 
                        v-if="outcomeData.authorList[0].id"
                        :to="`/profile/${outcomeData.authorList[0].id}`" 
                        class="author-name-link"
                        style="text-decoration: none;"
                      >
                        <div class="author-name">{{ outcomeData.authorList[0].name || outcomeData.authorList[0].account }}</div>
                      </router-link>
                      <!-- 没有ID时显示普通名字 -->
                      <div v-else class="author-name">{{ outcomeData.authorList[0].name || outcomeData.authorList[0].account }}</div>
                      <div class="author-info" v-if="outcomeData.authorList[0].institution">
                        <div class="info-label">机构：</div>
                        <div>{{ outcomeData.authorList[0].institution }}</div>
                      </div>
                      <div class="author-info" v-if="outcomeData.authorList[0].department">
                        <div class="info-label">院系：</div>
                        <div>{{ outcomeData.authorList[0].department }}</div>
                      </div>
                      <div class="author-info" v-if="outcomeData.authorList[0].jobTitle">
                        <div class="info-label">职称：</div>
                        <div>{{ outcomeData.authorList[0].jobTitle }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 其他作者 -->
                  <div class="other-authors" v-if="outcomeData.authorList.length > 1">
                    <div class="section-subtitle">其他作者</div>
                    <template v-for="(author, index) in outcomeData.authorList.slice(1)" :key="index">
                      <!-- 有ID时显示可点击链接 -->
                      <router-link 
                        v-if="author.id"
                        :to="`/profile/${author.id}`"
                        class="other-author-item"
                        style="text-decoration: none;"
                      >
                        {{ author.name || author.account }}
                      </router-link>
                      <!-- 没有ID时显示普通文字 -->
                      <div v-else class="other-author-item non-clickable">
                        {{ author.name || author.account }}
                      </div>
                    </template>
                  </div>
                </div>
                
                <!-- 无作者列表时使用静态数据 -->
                <div v-else class="authors-list">
                  <div class="author-item">
                    <div class="author-name">张三</div>
                    <div class="author-info">北京大学计算机科学与技术学院</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 编辑成果对话框 -->
  <el-dialog
    v-model="editDialogVisible"
    title="编辑成果信息"
    width="650px"
    :close-on-click-modal="false"
  >
    <div v-if="editFormData" class="edit-form">
      <el-form :model="editFormData" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="editFormData.title" placeholder="请输入成果标题"></el-input>
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="editFormData.authors" placeholder="多位作者请用逗号分隔"></el-input>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editFormData.type" placeholder="请选择成果类型" style="width: 100%">
            <el-option label="论文" value="article"></el-option>
            <el-option label="期刊" value="journal"></el-option>
            <el-option label="会议" value="conference"></el-option>
            <el-option label="专利" value="patent"></el-option>
            <el-option label="书籍" value="book"></el-option>
            <el-option label="章节" value="chapter"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="期刊名称" v-if="editFormData.type !== 'patent'">
          <el-input v-model="editFormData.journal" placeholder="请输入期刊名称"></el-input>
        </el-form-item>
        <el-form-item label="卷号" v-if="editFormData.type !== 'patent'">
          <el-input-number v-model="editFormData.volume" :min="0" placeholder="请输入卷号"></el-input-number>
        </el-form-item>
        <el-form-item label="期号" v-if="editFormData.type !== 'patent'">
          <el-input-number v-model="editFormData.issue" :min="0" placeholder="请输入期号"></el-input-number>
        </el-form-item>
        <el-form-item label="页码" v-if="editFormData.type !== 'patent'">
          <el-input v-model="editFormData.pages" placeholder="请输入页码，例如：156"></el-input>
        </el-form-item>
        <el-form-item label="专利号" v-if="editFormData.type === 'patent'">
          <el-input v-model="editFormData.patentNumber" placeholder="请输入专利号"></el-input>
        </el-form-item>
        <el-form-item label="发表日期">
          <el-date-picker
            v-model="editFormData.publishDate"
            type="date"
            placeholder="请选择发表日期"
            style="width: 100%"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="DOI" v-if="editFormData.type !== 'patent'">
          <el-input v-model="editFormData.doi" placeholder="请输入DOI"></el-input>
        </el-form-item>
        <el-form-item label="摘要">
          <el-input
            v-model="editFormData.abstractContent"
            type="textarea"
            :rows="4"
            placeholder="请输入摘要内容"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类/关键词">
          <el-input 
            v-model="editFormData.category" 
            placeholder="多个关键词请用、分隔"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submittingEdit">保存</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 上传文件对话框 -->
  <el-dialog title="上传成果全文" v-model="uploadDialogVisible" width="500px">
    <div class="upload-dialog-content">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        accept=".pdf"
      >
        <div style="font-size: 48px; margin-bottom: 16px;">📤</div>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只能上传PDF文件</div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadFile" :loading="uploading">上传</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getResearchOutcomeById, uploadResearchFile, ResearchOutcomeVO, getOutcomeComments, sendOutcomeComment, CommentVO, ResearchOutcomeMetaUploadRequest, updateResearchOutcomeMeta, likeOutcome, cancelLikeOutcome, isOutcomeLiked, getOutcomeLikeCount } from '@/api/outcome';
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
    
    // 编辑成果相关
    const editDialogVisible = ref(false);
    const editFormData = ref<ResearchOutcomeMetaUploadRequest | null>(null);
    const submittingEdit = ref(false);
    
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
    const currentUserId = computed(() => store.state.id || null);
    const currentUserAvatar = computed(() => store.state.avatar || '');
    
    // 点赞相关
    const isLiked = ref(false);
    const likingInProgress = ref(false);
    const likeCount = ref(0);
    
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
    
    // 显示编辑对话框
    const showEditDialog = () => {
      if (!outcomeData.value) return;
      
      // 复制当前成果数据到表单
      editFormData.value = {
        outcomeId: outcomeData.value.outcomeId,
        type: outcomeData.value.type,
        title: outcomeData.value.title,
        authors: outcomeData.value.authors,
        journal: outcomeData.value.journal,
        volume: outcomeData.value.volume,
        issue: outcomeData.value.issue,
        pages: outcomeData.value.pages,
        publishDate: outcomeData.value.publishDate,
        doi: outcomeData.value.doi,
        patentNumber: outcomeData.value.patentNumber,
        abstractContent: outcomeData.value.abstractContent,
        category: outcomeData.value.category
      };
      
      editDialogVisible.value = true;
    };
    
    // 提交编辑
    const submitEdit = async () => {
      if (!editFormData.value || !editFormData.value.outcomeId) {
        ElMessage.error('缺少必要的成果信息');
        return;
      }
      
      submittingEdit.value = true;
      try {
        const success = await updateResearchOutcomeMeta(editFormData.value);
        if (success) {
          ElMessage.success('成果信息更新成功');
          editDialogVisible.value = false;
          
          // 重新加载成果数据
          await loadOutcomeData();
        }
      } catch (error) {
        console.error('更新成果信息失败:', error);
        ElMessage.error('更新成果信息失败');
      } finally {
        submittingEdit.value = false;
      }
    };
    
    // 切换点赞状态
    const toggleLike = async () => {
      if (!currentUserId.value || !outcomeId.value) {
        ElMessage.warning('请先登录');
        return;
      }
      
      likingInProgress.value = true;
      try {
        let success = false;
        if (isLiked.value) {
          // 取消点赞
          success = await cancelLikeOutcome(currentUserId.value, Number(outcomeId.value));
        } else {
          // 点赞
          success = await likeOutcome(currentUserId.value, Number(outcomeId.value));
        }
        
        if (success) {
          const wasLiked = isLiked.value;
          isLiked.value = !isLiked.value;
          
          // 更新点赞数量
          if (wasLiked) {
            // 取消点赞，数量-1
            likeCount.value = Math.max(0, likeCount.value - 1);
          } else {
            // 点赞，数量+1
            likeCount.value = likeCount.value + 1;
          }
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        ElMessage.error('操作失败');
      } finally {
        likingInProgress.value = false;
      }
    };
    
    // 检查点赞状态
    const checkLikeStatus = async () => {
      if (!currentUserId.value || !outcomeId.value) {
        return;
      }
      
      try {
        const liked = await isOutcomeLiked(currentUserId.value, Number(outcomeId.value));
        isLiked.value = liked;
      } catch (error) {
        console.error('检查点赞状态失败:', error);
      }
    };
    
    // 获取点赞数量
    const loadLikeCount = async () => {
      if (!outcomeId.value) {
        return;
      }
      
      try {
        const count = await getOutcomeLikeCount(Number(outcomeId.value));
        likeCount.value = count;
      } catch (error) {
        console.error('获取点赞数量失败:', error);
        likeCount.value = 0;
      }
    };
    
    // 页面加载时获取数据
    onMounted(() => {
      loadOutcomeData();
      loadComments();
      checkLikeStatus();
      loadLikeCount();
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
      handlePageChange,
      // 编辑相关
      editDialogVisible,
      editFormData,
      submittingEdit,
      showEditDialog,
      submitEdit,
      // 点赞相关
      isLiked,
      likingInProgress,
      likeCount,
      toggleLike,
      checkLikeStatus,
      loadLikeCount
    };
  }
});
</script>

<style scoped>
/* 背景容器 */
.bg-container {
  background: url('@/asset/home/homehead.png');
  position: fixed;
  height: 100vh;
  width: 100vw;
  z-index: -2;
  top: 0;
  left: 0;
  background-size: cover;
}

/* 主容器布局 */
.view-set-margin {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 100px;
  padding-bottom: 40px;
}

.outcome-detail-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 20px;
}

.outcome-content {
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  gap: 25px;
  width: 100%;
}

.content-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.content-right {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  position: sticky;
  top: 100px;
  align-self: flex-start;
  z-index: 10;
}

/* 卡片样式 */
.section-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.section-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.comment-count {
  font-size: 14px;
  color: #909399;
  margin-left: 8px;
}

.card-content {
  padding: 24px;
  text-align: left;
}

/* 标题卡片特殊样式 */
.title-card .card-content {
  padding: 32px 24px 24px;
}

.outcome-header {
  position: relative;
  margin-bottom: 24px;
}

.outcome-title {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.3;
  color: #2c3e50;
  margin-top: 12px;
}

.edit-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
}

.like-section-bottom {
  padding: 16px 0 0 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
}

/* 元数据样式 */
.outcome-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 0;
}

.type-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  background: #909399; /* 默认背景色 */
}

.type-tag.article { background: #67c23a !important; }
.type-tag.journal { background: #409eff !important; }
.type-tag.conference { background: #e6a23c !important; }
.type-tag.patent { background: #f56c6c !important; }
.type-tag.book { background: #909399 !important; }
.type-tag.chapter { background: #8e44ad !important; }

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: #f0f9ff;
  color: #1890ff;
  border: 1px solid #d6f3ff;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: flex-start;
}

.meta-label {
  min-width: 80px;
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.meta-value {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  text-align: left;
}

/* 摘要样式 */
.abstract-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  text-align: left;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

/* 关键词样式 */
.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  text-align: left;
}

.keyword-tag {
  margin: 0;
  background: #e8f4fd !important;
  color: #1890ff !important;
  border: 1px solid #bee7ff !important;
}

/* 链接样式 */
.links-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 0;
  border: 1px solid #e9ecef;
}

.link-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

/* 评论区样式 */
.comment-input-container {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 0;
  margin-bottom: 20px;
}

.comment-input-wrapper {
  flex: 1;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 0;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.comment-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.comment-list {
  min-height: 200px;
}

.comment-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #fdfdfd;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.comment-item:hover {
  background: #fafafa;
  border-color: #e0e0e0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-left: 50px;
  text-align: left;
}

.reply-input-container {
  margin-top: 12px;
  margin-left: 50px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.reply-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  font-size: 13px;
  line-height: 1.4;
  color: #606266;
  box-sizing: border-box;
  font-family: inherit;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.reply-list {
  margin-top: 12px;
  margin-left: 50px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reply-item {
  padding: 12px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 8px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-content {
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  text-align: left;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 侧边栏信息卡片 */
.info-sidebar-card,
.author-sidebar-card {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .info-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  text-align: left;
}

/* 作者信息样式 */
.authors-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-author {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.author-avatar {
  flex-shrink: 0;
}

.author-details {
  flex: 1;
  text-align: left;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.author-avatar-link {
  transition: transform 0.2s ease;
  cursor: pointer;
}

.author-avatar-link:hover {
  transform: scale(1.05);
}

.author-name-link {
  transition: color 0.2s ease;
  cursor: pointer;
}

.author-name-link:hover {
  color: #409eff !important;
}

.author-name-link:hover .author-name {
  color: #409eff;
}

.author-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
  text-align: left;
}

.author-info .info-label {
  min-width: 40px;
  color: #999;
  font-weight: 500;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.other-authors {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.other-author-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  text-align: left;
  display: block;
  transition: all 0.2s ease;
  cursor: pointer;
}

.other-author-item:hover {
  background: #e8f4fd;
  color: #409eff;
  transform: translateX(2px);
}

.other-author-item:last-child {
  margin-bottom: 0;
}

.other-author-item.non-clickable {
  cursor: default;
}

.other-author-item.non-clickable:hover {
  background: #f5f7fa;
  color: #666;
  transform: none;
}

/* 加载状态 */
.loading-container {
  padding: 40px 20px;
}

/* 空状态 */
.empty-comment {
  padding: 40px 20px;
  text-align: center;
}

/* 文件上传对话框 */
.edit-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.upload-dialog-content {
  text-align: center;
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .content-right {
    width: 100%;
    position: static;
    top: auto;
  }
  
  .outcome-title {
    font-size: 24px;
  }
  
  .edit-actions {
    position: static;
    margin-top: 16px;
  }
  
  .comment-content,
  .reply-content {
    margin-left: 0;
  }
  
  .reply-input-container,
  .reply-list {
    margin-left: 0;
  }
}
</style> 