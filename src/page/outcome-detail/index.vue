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
                    <el-button type="danger" size="small" @click="deleteOutcomeMethod" :loading="deletingOutcome" style="margin-right: 10px;">
                      🗑️ 删除成果
                    </el-button>
                    <el-button type="success" size="small" @click="showUploadDialog" style="margin-right: 10px;">
                      📤 上传全文
                    </el-button>
                    <el-button 
                      v-if="outcomeData.url || outcomeData.pdfUrl" 
                      type="danger" 
                      size="small" 
                      @click="deleteOutcomeFileMethod"
                      :loading="deletingOutcomeFile"
                    >
                      🗑️ 删除原文
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
                
                <!-- 点赞和收藏按钮 (放在卡片左下角) -->
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
                  <el-button 
                    v-if="isLiterature"
                    type="primary" 
                    size="small" 
                    @click="showFavoriteDialog"
                    plain
                  >
                    📚 收藏
                  </el-button>
                </div>
              </div>
              <div v-else class="error-container">
                <el-empty description="研究成果不存在或已被删除"></el-empty>
                <div class="error-actions">
                  <p>将在3秒后自动跳转到首页...</p>
                  <el-button type="primary" @click="goToHome">立即返回首页</el-button>
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
            <div class="section-card links-card" v-if="outcomeData">
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
                  <div v-if="outcomeData.url" class="link-item">
                    <span class="link-label">批注阅读</span>
                    <el-button type="primary" size="small" @click="goToPdfReader(outcomeData.outcomeId)" plain>
                      📝 打开阅读器
                    </el-button>
                  </div>
                  <div v-if="!outcomeData.url && !outcomeData.pdfUrl && !isCurrentUserAuthor" class="link-item">
                    <span class="link-label">全文申请</span>
                    <el-button 
                      type="warning" 
                      size="small" 
                      @click="applyForOutcomeFullText" 
                      plain
                      :loading="applyingFullText"
                      :disabled="hasAppliedFullText"
                    >
                      📄 申请查看全文
                    </el-button>
                  </div>
                  <div v-if="!outcomeData.url && !outcomeData.pdfUrl && isCurrentUserAuthor" class="link-item">
                    <span class="link-label">全文上传</span>
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="showUploadDialog" 
                      plain
                    >
                      📤 上传全文
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
            <div class="section-card comments-card" v-if="outcomeData">
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
                          <!-- 删除按钮，只有当评论是用户自己的评论时才显示 -->
                          <el-button
                            v-if="currentUserId && comment.userId === currentUserId"
                            type="text"
                            @click="deleteComment(comment.commentId)"
                            size="small"
                            :loading="deletingCommentId === comment.commentId"
                            style="color: #F56C6C;"
                          >
                            删除
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
                            <!-- 二级评论删除按钮 -->
                            <div class="reply-actions" v-if="currentUserId && reply.userId === currentUserId">
                              <el-button
                                type="text"
                                @click="deleteComment(reply.commentId)"
                                size="small"
                                :loading="deletingCommentId === reply.commentId"
                                style="color: #F56C6C;"
                              >
                                删除
                              </el-button>
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
          <div class="content-right" v-if="outcomeData">
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
                    <div class="author-name">暂无作者</div>
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
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
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
        <el-button type="primary" @click="submitEdit" :loading="submittingEdit">
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 上传文件对话框 -->
  <el-dialog
    v-model="uploadDialogVisible"
    title="上传研究成果全文"
    width="650px"
    :close-on-click-modal="false"
  >
    <div class="upload-form">
      <el-tabs v-model="uploadActiveTab" :before-change="handleTabChange">
        <el-tab-pane label="版权与隐私确认" name="terms" class="terms-tab-pane">
          <div class="terms-container">
            <h3>版权声明与隐私确认</h3>
            
            <div class="terms-section">
              <h4><i class="el-icon-document"></i> 版权确认条款</h4>
              <div class="terms-quote">
                "我确认我有权利公开分享此文档，我理解并同意本网站的上传条件。我保证上传的内容不侵犯任何第三方的版权或其他知识产权。如果我上传的内容包含他人的受版权保护的材料，我已获得必要的许可。"
              </div>
            </div>
            
            <div class="terms-section">
              <h4><i class="el-icon-lock"></i> 隐私保护</h4>
              <ul>
                <li>用户需确认上传内容不包含任何个人隐私信息或敏感数据</li>
                <li>对于涉及人类受试者的研究，需确认已获得必要的伦理审查和参与者同意</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h4><i class="el-icon-refresh"></i> 回溯确认</h4>
              <ul>
                <li>对于本政策实施前已上传的全文，系统将通知相关用户在30天内完成版权确认</li>
                <li>未在规定时间内确认的全文将被转为"仅元数据"可见状态</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h4><i class="el-icon-s-claim"></i> 权利与责任</h4>
              <div class="terms-subsection">
                <h5>用户权利</h5>
                <ul>
                  <li>随时可以撤回已上传的全文（元数据将保留）</li>
                  <li>可以更新或更正已上传成果的信息</li>
                </ul>
              </div>
              <div class="terms-subsection">
                <h5>网站权利</h5>
                <ul>
                  <li>有权移除任何涉嫌侵权或不符合政策的内容</li>
                  <li>保留展示成果元数据的权利，即使全文被撤回</li>
                </ul>
              </div>
              <div class="terms-subsection">
                <h5>免责声明</h5>
                <ul>
                  <li>网站不承担用户上传内容引发的版权纠纷责任</li>
                  <li>用户需自行确保上传内容的合法性和适当性</li>
                </ul>
              </div>
            </div>
            
            <div class="terms-section">
              <h4><i class="el-icon-s-operation"></i> 实施条款</h4>
              <ol>
                <li>本条件自发布之日起生效</li>
                <li>所有用户上传行为视为已阅读并同意本条件</li>
                <li>网站保留修改本条件的权利，修改后将通过公告通知用户</li>
              </ol>
            </div>
            
            <div class="terms-agreement">
              <el-checkbox v-model="termsAgreed">我已阅读并同意上述版权声明与隐私确认条款</el-checkbox>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="上传文件" name="upload" :disabled="!termsAgreed">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :file-list="fileList"
            :on-change="handleFileChange"
            accept=".pdf"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传PDF文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </el-tab-pane>
      </el-tabs>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button v-if="uploadActiveTab === 'terms'" type="primary" @click="proceedToUpload" :disabled="!termsAgreed">
          继续
        </el-button>
        <el-button v-else type="primary" @click="uploadFile" :loading="uploading" :disabled="!selectedFile">
          上传
        </el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 收藏对话框 -->
  <el-dialog
    v-model="favoriteDialogVisible"
    title="选择收藏夹"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="favorite-dialog-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <div class="breadcrumb-title">文献库目录</div>
        <div class="breadcrumb-list">
          <span 
            v-for="(item, index) in breadcrumbList" 
            :key="index"
            class="breadcrumb-item"
            :class="{ 'active': index === breadcrumbList.length - 1 }"
            @click="navigateToBreadcrumb(index)"
          >
            {{ item.name }}
            <span v-if="index < breadcrumbList.length - 1" class="breadcrumb-separator">/</span>
          </span>
        </div>
        <el-button 
          v-if="breadcrumbList.length > 1"
          type="text" 
          @click="backToParentFolder"
          class="back-button"
        >
          ← 返回上一级
        </el-button>
      </div>
      <!-- 新建收藏夹按钮 -->
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <el-tooltip :content="createFolderTooltip" placement="right">
          <el-button type="primary" @click="showCreateFolderDialog = true">
            新建收藏夹
          </el-button>
        </el-tooltip>
      </div>
      
      <!-- 收藏夹列表 -->
      <div class="folders-container" v-loading="loadingFolders || loadingOriginalFolders">
        <div v-if="!loadingFolders && !loadingOriginalFolders && folders.length === 0" class="empty-folders">
          <el-empty description="当前目录下暂无收藏夹"></el-empty>
        </div>
        
        <div v-else class="folders-grid">
          <div 
            v-for="folder in folders" 
            :key="folder.favoriteId"
            class="folder-item"
            :class="{ 
              'selected': selectedFolders.some(f => f.favoriteId === folder.favoriteId),
              'originally-selected': originalSelectedFolders.some(f => f.favoriteId === folder.favoriteId)
            }"
            @click="toggleFolderSelection(folder)"
          >
            <div class="folder-icon">📁</div>
            <div class="folder-name">{{ folder.name }}</div>
            <div class="folder-status" v-if="originalSelectedFolders.some(f => f.favoriteId === folder.favoriteId)">
              <el-tag size="small" type="info">已收藏</el-tag>
            </div>
            <div class="folder-actions">
              <el-button
                @click.stop="openFolder(folder)"
                class="open-folder-btn"
              >
                打开
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > folderPageSize">
        <el-pagination
          v-model:current-page="folderCurrentPage"
          :page-size="folderPageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handleFolderPageChange"
        />
      </div>
      
      <!-- 已选择的收藏夹 -->
      <div class="selected-folders" v-if="selectedFolders.length > 0">
        <div class="selected-title">已选择的收藏夹：</div>
        <div class="selected-list">
          <el-tag 
            v-for="folder in selectedFolders" 
            :key="folder.favoriteId"
            closable
            @close="toggleFolderSelection(folder)"
            class="selected-tag"
          >
            {{ folder.name }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="favoriteDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmFavorite"
        >
          确认收藏
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 新建收藏夹对话框 -->
  <el-dialog
    v-model="showCreateFolderDialog"
    title="新建收藏夹"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-input v-model="newFolderName" placeholder="请输入收藏夹名称" maxlength="50" show-word-limit />
    <template #footer>
      <el-button @click="showCreateFolderDialog = false">取消</el-button>
      <el-button type="primary" @click="handleCreateFolder" :loading="creatingFolder">创建</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getResearchOutcomeById, uploadResearchFile, ResearchOutcomeVO, getOutcomeComments, sendOutcomeComment, CommentVO, ResearchOutcomeMetaUploadRequest, updateResearchOutcomeMeta, likeOutcome, cancelLikeOutcome, isOutcomeLiked, getOutcomeLikeCount, deleteOutcomeComment, applyForFullText, deleteOutcomeFile, deleteOutcome } from '@/api/outcome';
import { getFavoritePage, addOutcomeToFavorite, Favorite, findFavoriteByOutcome, removeOutcomeFromFavorite, createFavorite } from '@/api/favorite';
import { ElMessage, ElMessageBox } from 'element-plus';
import store from '@/store';
import dayjs from 'dayjs';

export default defineComponent({
  name: 'OutcomeDetail',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const outcomeData = ref<ResearchOutcomeVO | null>(null);
    
    // 文件上传相关
    const uploadDialogVisible = ref(false);
    const fileList = ref<any[]>([]);
    const selectedFile = ref<File | null>(null);
    const uploading = ref(false);
    const uploadActiveTab = ref('upload');
    const termsAgreed = ref(false);
    
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
    const deletingCommentId = ref<number | null>(null); // 正在删除的评论ID
    
    // 获取当前用户信息
    const currentUserId = computed(() => store.state.id || null);
    const currentUserAvatar = computed(() => store.state.avatar || '');
    const currentUserName = computed(() => store.state.name || '');
    
    // 判断当前用户是否为作者
    const isCurrentUserAuthor = computed(() => {
      // console.log('调试信息 - 当前用户ID:', currentUserId.value);
      
      // 如果没有当前用户ID或成果数据，则不是作者
      if (!currentUserId.value || !outcomeData.value) {
        // console.log('调试信息 - 用户ID或成果数据为空，不是作者');
        return false;
      }
      
      // 1. 如果成果标记为当前用户的成果，直接返回true
      if (outcomeData.value.isMine) {
        // console.log('调试信息 - 成果被标记为当前用户的成果');
        return true;
      }
      
      // 2. 检查authorList中是否有当前用户的ID
      if (outcomeData.value.authorList && outcomeData.value.authorList.length > 0) {
        const authorIds = outcomeData.value.authorList.map(author => author.id);
        // console.log('调试信息 - 作者ID列表:', authorIds);
        // console.log('调试信息 - 当前用户ID:', currentUserId.value);
        
        const isAuthor = authorIds.includes(currentUserId.value);
        // console.log('调试信息 - 用户ID是否在作者列表中:', isAuthor);
        return isAuthor;
      }
      
      // 如果没有作者列表，则不是作者
      // console.log('调试信息 - 没有作者列表，不是作者');
      return false;
    });
    
    // 点赞相关
    const isLiked = ref(false);
    const likingInProgress = ref(false);
    const likeCount = ref(0);
    
    // 全文申请相关
    const applyingFullText = ref(false);
    const hasAppliedFullText = ref(false);
    
    // 收藏相关
    const favoriteDialogVisible = ref(false);
    const folders = ref<Favorite[]>([]);
    const selectedFolders = ref<Favorite[]>([]);
    const originalSelectedFolders = ref<Favorite[]>([]); // 原始选择的收藏夹，用于比较变化
    const loadingFolders = ref(false);
    const loadingOriginalFolders = ref(false); // 加载原始收藏夹状态
    const currentParentId = ref(0);
    const breadcrumbList = ref<{favoriteId: number, name: string}[]>([
      { favoriteId: 0, name: '文献库' }
    ]);
    const folderCurrentPage = ref(1);
    const folderPageSize = ref(6);
    const total = ref(0);
    
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
        // console.error('加载评论失败:', error);
        ElMessage.error('加载评论失败');
      } finally {
        loadingComments.value = false;
      }
    };
    
    // 提交评论
    const submitComment = async () => {
      // console.log('===== 调试评论问题 =====');
      // console.log('提交评论原始内容:', commentText.value);
      // console.log('评论内容类型:', typeof commentText.value);
      // console.log('评论内容长度:', commentText.value ? commentText.value.length : 0);
      // console.log('评论trim后长度:', commentText.value ? commentText.value.trim().length : 0);
      
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
      
      // console.log('准备发送评论数据:', commentData);
      
      submittingComment.value = true;
      try {
        const result = await sendOutcomeComment(commentData);
        // console.log('评论发送结果:', result);
        
        if (result) {
          ElMessage.success('评论发布成功');
          commentText.value = '';
          await loadComments(); // 重新加载评论列表
        }
      } catch (error) {
        // console.error('发布评论失败:', error);
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
      // console.log('提交回复:', replyText.value);
      // console.log('回复内容长度:', replyText.value ? replyText.value.length : 0);
      // console.log('回复trim后长度:', replyText.value ? replyText.value.trim().length : 0);
      // console.log('父评论ID:', parentId); // 打印父评论ID，确保正确
      
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
      
      // console.log('准备发送回复数据:', replyData);
      
      submittingReply.value = true;
      try {
        const result = await sendOutcomeComment(replyData);
        // console.log('回复发送结果:', result);
        
        if (result) {
          ElMessage.success('回复发布成功');
          replyText.value = '';
          replyingToId.value = null;
          await loadComments(); // 重新加载评论列表
        }
      } catch (error) {
        // console.error('发布回复失败:', error);
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
      // console.log('调试信息 - 开始加载成果数据, 成果ID:', outcomeId.value);
      try {
        if (outcomeId.value) {
          // 有ID，从后端获取数据
          const data = await getResearchOutcomeById(Number(outcomeId.value));
          if (data) {
            outcomeData.value = data;
            // console.log('调试信息 - 成功加载成果数据:', data);
            // console.log('调试信息 - 成果作者:', data.authors);
            // console.log('调试信息 - 成果是否为当前用户的:', data.isMine);
            if (data.authorList) {
              // console.log('调试信息 - 成果作者列表:', data.authorList);
            }
            console.log(outcomeData.value);
          } else {
            outcomeData.value = null;
            // console.log('调试信息 - 成果数据为空');
            ElMessage.error('研究成果不存在或已被删除，3秒后将自动跳转到首页');
            // 设置3秒后自动跳转到首页
            setTimeout(() => {
              goToHome();
            }, 3000);
          }
        } else {
          // 无ID，提示错误并跳转
          outcomeData.value = null;
          // console.log('调试信息 - 未提供成果ID');
          ElMessage.error('未提供成果ID，3秒后将自动跳转到首页');
          // 设置3秒后自动跳转到首页
          setTimeout(() => {
            goToHome();
          }, 3000);
        }
      } catch (error) {
        // console.error('调试信息 - 加载研究成果数据失败:', error);
        outcomeData.value = null;
        ElMessage.error('获取研究成果信息出错，3秒后将自动跳转到首页');
        // 设置3秒后自动跳转到首页
        setTimeout(() => {
          goToHome();
        }, 3000);
      } finally {
        loading.value = false;
      }
    };
    
    // 跳转到首页
    const goToHome = () => {
      router.push('/');
    };
    
    // 跳转到PDF阅读器页面
    const goToPdfReader = (outcomeId: number) => {
      router.push(`/pdf-reader/${outcomeId}`);
    };
    
    // 显示上传对话框
    const showUploadDialog = () => {
      uploadDialogVisible.value = true;
      uploadActiveTab.value = 'terms';
      fileList.value = [];
      selectedFile.value = null;
      termsAgreed.value = false;
    };
    
    // 处理标签页切换
    const handleTabChange = (activeName: string, oldActiveName: string) => {
      if (activeName === 'upload' && !termsAgreed.value) {
        ElMessage.warning('请先阅读并同意版权声明与隐私确认条款');
        return false;
      }
      return true;
    };
    
    // 处理继续按钮
    const proceedToUpload = () => {
      if (!termsAgreed.value) {
        ElMessage.warning('请先阅读并同意版权声明与隐私确认条款');
        return;
      }
      uploadActiveTab.value = 'upload';
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
        // console.error('上传文件失败:', error);
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
      
      // 检查并确保日期格式正确，转换为后端需要的date-time格式
      if (editFormData.value.publishDate) {
        try {
          // 使用dayjs格式化日期为 YYYY-MM-DD HH:mm:ss 格式
          editFormData.value.publishDate = dayjs(editFormData.value.publishDate).format('YYYY-MM-DD 00:00:00');
          console.log('发送的日期格式:', editFormData.value.publishDate);
        } catch (e) {
          console.error('日期格式化错误:', e);
          ElMessage.warning('发表日期格式有误，请重新选择');
          return;
        }
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
        // console.error('更新成果信息失败:', error);
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
        // console.error('点赞操作失败:', error);
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
        // console.error('检查点赞状态失败:', error);
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
        // console.error('获取点赞数量失败:', error);
        likeCount.value = 0;
      }
    };
    
    // 删除评论
    const deleteComment = async (commentId: number) => {
      if (!currentUserId.value) {
        ElMessage.warning('请先登录');
        return;
      }
      
      deletingCommentId.value = commentId;
      try {
        const success = await deleteOutcomeComment(commentId);
        if (success) {
          ElMessage.success('评论删除成功');
          await loadComments();
        }
      } catch (error) {
        // console.error('删除评论失败:', error);
        ElMessage.error('删除评论失败');
      } finally {
        deletingCommentId.value = null;
      }
    };
    
    // 申请查看全文
    const applyForOutcomeFullText = async () => {
      if (!currentUserId.value) {
        ElMessage.warning('请先登录');
        return;
      }
      
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID，申请失败');
        return;
      }
      
      applyingFullText.value = true;
      try {
        const success = await applyForFullText(outcomeData.value.outcomeId);
        if (success) {
          hasAppliedFullText.value = true;
        }
      } catch (error) {
        // console.error('申请全文失败:', error);
        ElMessage.error('申请全文失败');
      } finally {
        applyingFullText.value = false;
      }
    };
    
    // 显示收藏对话框
    const showFavoriteDialog = async () => {
      if (!currentUserId.value) {
        ElMessage.warning('请先登录');
        return;
      }
      
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID');
        return;
      }
      
      favoriteDialogVisible.value = true;
      selectedFolders.value = [];
      originalSelectedFolders.value = [];
      
      // 先加载原始收藏夹状态
      await loadOriginalFavoriteFolders();
      
      // 然后加载收藏夹列表
      await loadFolders();
    };
    
    // 加载收藏夹列表
    const loadFolders = async () => {
      loadingFolders.value = true;
      try {
        const result = await getFavoritePage({
          pageSize: folderPageSize.value,
          pageNum: folderCurrentPage.value,
          parentId: currentParentId.value
        });
        
        if (result) {
          folders.value = result.list;
          total.value = result.total;
        } else {
          folders.value = [];
          total.value = 0;
        }
      } catch (error) {
        console.error('加载收藏夹失败:', error);
        folders.value = [];
        total.value = 0;
      } finally {
        loadingFolders.value = false;
      }
    };
    
    // 导航到指定收藏夹
    const navigateToFolder = async (parentId: number) => {
      currentParentId.value = parentId;
      folderCurrentPage.value = 1;
      await loadFolders();
      updateBreadcrumb(parentId);
    };
    
    // 更新面包屑导航
    const updateBreadcrumb = (parentId: number) => {
      breadcrumbList.value = []
      if (parentId !== 0) {
        breadcrumbList.value.push({
          favoriteId: parentId,
          name: '收藏夹'
        })
      }
    };
    
    // 面包屑导航点击
    const navigateToBreadcrumb = async (index: number) => {
      if (index < breadcrumbList.value.length - 1) {
        const targetItem = breadcrumbList.value[index]
        currentParentId.value = targetItem.favoriteId
        
        breadcrumbList.value = breadcrumbList.value.slice(0, index + 1)
        await loadFolders()
      }
    };
    
    // 返回上一级收藏夹
    const backToParentFolder = async () => {
      if (breadcrumbList.value.length > 1) {
        breadcrumbList.value.pop()
        
        const newCurrentItem = breadcrumbList.value[breadcrumbList.value.length - 1]
        currentParentId.value = newCurrentItem.favoriteId
        
        await loadFolders()
      }
    };
    
    // 打开收藏夹
    const openFolder = async (folder: Favorite) => {
      breadcrumbList.value.push({
        favoriteId: folder.favoriteId,
        name: folder.name
      })
      
      currentParentId.value = folder.favoriteId
      await loadFolders()
    };
    
    // 选择/取消选择收藏夹
    const toggleFolderSelection = (folder: Favorite) => {
      const index = selectedFolders.value.findIndex(f => f.favoriteId === folder.favoriteId);
      if (index > -1) {
        selectedFolders.value.splice(index, 1);
      } else {
        selectedFolders.value.push(folder);
      }
    };
    
    // 确认收藏
    const confirmFavorite = async () => {
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID');
        return;
      }
      
      try {
        const originalIds = originalSelectedFolders.value.map(f => f.favoriteId);
        const currentIds = selectedFolders.value.map(f => f.favoriteId);
        
        // 找出需要添加的收藏夹
        const toAdd = selectedFolders.value.filter(f => !originalIds.includes(f.favoriteId));
        
        // 找出需要移除的收藏夹
        const toRemove = originalSelectedFolders.value.filter(f => !currentIds.includes(f.favoriteId));
        
        let successCount = 0;
        let errorCount = 0;
        
        // 添加新的收藏夹
        for (const folder of toAdd) {
          const success = await addOutcomeToFavorite({
            favoriteId: folder.favoriteId,
            outcomeId: outcomeData.value.outcomeId
          });
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
        
        // 移除收藏夹
        for (const folder of toRemove) {
          const success = await removeOutcomeFromFavorite({
            favoriteId: folder.favoriteId,
            outcomeId: outcomeData.value.outcomeId
          });
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
        
        if (toAdd.length === 0 && toRemove.length === 0) {
          ElMessage.info('收藏夹状态未发生变化');
        } else if (errorCount === 0) {
          ElMessage.success(`收藏夹更新成功`);
          favoriteDialogVisible.value = false;
        } else {
          ElMessage.warning(`部分操作失败，成功：${successCount}，失败：${errorCount}`);
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        ElMessage.error('收藏操作失败');
      }
    };
    
    // 分页处理
    const handleFolderPageChange = async (page: number) => {
      folderCurrentPage.value = page;
      await loadFolders();
    };
    
    // 删除成果原文
    const deletingOutcomeFile = ref(false);
    const deleteOutcomeFileMethod = async () => {
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID，删除失败');
        return;
      }
      
      // 显示确认对话框
      try {
        await ElMessageBox.confirm(
          '确定要删除该成果的原文吗？此操作不可逆。',
          '删除原文确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        deletingOutcomeFile.value = true;
        try {
          const success = await deleteOutcomeFile(outcomeData.value.outcomeId);
          if (success) {
            // 重新加载成果信息
            await loadOutcomeData();
          }
        } catch (error) {
          // console.error('删除成果原文失败:', error);
          ElMessage.error('删除成果原文失败');
        } finally {
          deletingOutcomeFile.value = false;
        }
      } catch (error) {
        // 用户取消删除
        // console.log('用户取消删除原文');
      }
    };
    
    // 删除成果
    const deletingOutcome = ref(false);
    const deleteOutcomeMethod = async () => {
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        ElMessage.error('无法获取成果ID，删除失败');
        return;
      }
      
      // 显示确认对话框
      try {
        await ElMessageBox.confirm(
          '确定要删除该成果吗？此操作不可逆，将永久删除该成果及其所有相关数据。',
          '删除成果确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        deletingOutcome.value = true;
        try {
          const success = await deleteOutcome(outcomeData.value.outcomeId);
          if (success) {
            ElMessage.success('成果已成功删除');
            // 删除成功后返回首页或其他页面
            router.push('/home');
          }
        } catch (error) {
          // console.error('删除成果失败:', error);
          ElMessage.error('删除成果失败');
        } finally {
          deletingOutcome.value = false;
        }
      } catch (error) {
        // 用户取消删除
        // console.log('用户取消删除成果');
      }
    };
    
    // 页面加载时获取数据
    onMounted(() => {
      // console.log('调试信息 - 组件挂载');
      // console.log('调试信息 - 当前用户信息:', {
      //   id: store.state.id,
      //   name: store.state.name,
      //   nickname: store.state.nickname,
      //   role: store.state.role
      // });
      
      loadOutcomeData();
      loadComments();
      checkLikeStatus();
      loadLikeCount();
    });
    
    // 加载原始收藏夹状态
    const loadOriginalFavoriteFolders = async () => {
      if (!outcomeData.value || !outcomeData.value.outcomeId) {
        return;
      }
      
      loadingOriginalFolders.value = true;
      try {
        const favoriteIds = await findFavoriteByOutcome(outcomeData.value.outcomeId);
        if (favoriteIds && favoriteIds.length > 0) {
          // 获取收藏夹详细信息
          const originalFolders: Favorite[] = [];
          
          // 递归查找收藏夹的函数
          const findFolderRecursively = async (parentId: number, targetId: number): Promise<Favorite | null> => {
            const result = await getFavoritePage({
              pageSize: 1000,
              pageNum: 1,
              parentId: parentId
            });
            
            if (!result) {
              return null;
            }
            
            // 在当前层级查找
            for (const folder of result.list) {
              if (folder.favoriteId === targetId) {
                return folder;
              }
            }
            
            // 递归查找子文件夹
            for (const folder of result.list) {
              const found = await findFolderRecursively(folder.favoriteId, targetId);
              if (found) {
                return found;
              }
            }
            
            return null;
          };
          
          // 为每个收藏夹ID查找详细信息
          for (const favoriteId of favoriteIds) {
            const foundFolder = await findFolderRecursively(0, favoriteId);
            if (foundFolder) {
              originalFolders.push(foundFolder);
            } else {
              // 如果找不到，使用默认信息
              originalFolders.push({
                favoriteId: favoriteId,
                name: `收藏夹${favoriteId}`,
                userId: currentUserId.value || 0,
                parentId: 0
              });
            }
          }
          
          originalSelectedFolders.value = originalFolders;
          selectedFolders.value = [...originalFolders]; // 初始选择状态与原始状态相同
        } else {
          originalSelectedFolders.value = [];
          selectedFolders.value = [];
        }
      } catch (error) {
        console.error('加载原始收藏夹状态失败:', error);
        originalSelectedFolders.value = [];
        selectedFolders.value = [];
      } finally {
        loadingOriginalFolders.value = false;
      }
    };

    const showCreateFolderDialog = ref(false);
    const newFolderName = ref('');
    const creatingFolder = ref(false);

    const handleCreateFolder = async () => {
      if (!newFolderName.value.trim()) {
        ElMessage.warning('请输入收藏夹名称');
        return;
      }
      creatingFolder.value = true;
      try {
        const result = await createFavorite({ name: newFolderName.value.trim(), parentId: currentParentId.value });
        if (result) {
          ElMessage.success('创建成功');
          showCreateFolderDialog.value = false;
          newFolderName.value = '';
          await loadFolders();
        } else {
          ElMessage.error('创建失败');
        }
      } catch (e) {
        ElMessage.error('创建失败');
      } finally {
        creatingFolder.value = false;
      }
    };
    
    // 获取当前目录名称
    const getCurrentFolderName = () => {
      if (breadcrumbList.value.length > 0) {
        return breadcrumbList.value[breadcrumbList.value.length - 1].name;
      }
      return '文献库';
    };
    
    // 计算属性：新建收藏夹的tooltip内容
    const createFolderTooltip = computed(() => {
      const currentName = getCurrentFolderName();
      return `在"${currentName}"下新建收藏夹`;
    });
    
    // 判断是否为文献类型（会议论文或期刊论文）
    const isLiterature = computed(() => {
      if (!outcomeData.value || !outcomeData.value.type) return false;
      return outcomeData.value.type === '会议论文' || outcomeData.value.type === '期刊论文';
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
      uploadActiveTab,
      termsAgreed,
      showUploadDialog,
      handleFileChange,
      uploadFile,
      handleTabChange,
      proceedToUpload,
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
      currentUserId,
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
      loadLikeCount,
      // 导航相关
      goToHome,
      goToPdfReader,
      // 删除评论相关
      deletingCommentId,
      deleteComment,
      // 全文申请相关
      applyingFullText,
      hasAppliedFullText,
      applyForOutcomeFullText,
      // 收藏相关
      favoriteDialogVisible,
      folders,
      selectedFolders,
      originalSelectedFolders,
      loadingFolders,
      loadingOriginalFolders,
      currentParentId,
      breadcrumbList,
      folderCurrentPage,
      folderPageSize,
      total,
      showFavoriteDialog,
      loadFolders,
      loadOriginalFavoriteFolders,
      navigateToFolder,
      updateBreadcrumb,
      navigateToBreadcrumb,
      backToParentFolder,
      openFolder,
      toggleFolderSelection,
      confirmFavorite,
      handleFolderPageChange,
      // 用户是否为作者
      isCurrentUserAuthor,
      // 删除成果原文相关
      deletingOutcomeFile,
      deleteOutcomeFileMethod,
      // 删除成果相关
      deletingOutcome,
      deleteOutcomeMethod,
      showCreateFolderDialog,
      newFolderName,
      creatingFolder,
      handleCreateFolder,
      getCurrentFolderName,
      createFolderTooltip,
      isLiterature
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

.error-container {
  padding: 40px 0;
  text-align: center;
}

.error-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.error-actions p {
  color: #606266;
  font-size: 14px;
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

.link-buttons {
  display: flex;
  gap: 8px;
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
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-content {
  margin-left: 40px;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
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

/* 版权条款样式 */
.terms-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 10px;
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.terms-container h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 12px;
  font-weight: 600;
  position: relative;
}

.terms-container h3:after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
}

.terms-section {
  margin-bottom: 25px;
  text-align: left;
  padding: 0 5px;
}

.terms-section h4 {
  font-size: 16px;
  color: #409eff;
  margin-bottom: 12px;
  font-weight: 600;
  border-left: 4px solid #409eff;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.terms-section h4 i {
  margin-right: 8px;
  font-size: 18px;
}

.terms-subsection h5 {
  font-size: 14px;
  color: #606266;
  margin: 12px 0 8px;
  font-weight: 600;
  border-left: 3px solid #67c23a;
  padding-left: 8px;
}

.terms-quote {
  background-color: #f8f9fa;
  border-left: 4px solid #409eff;
  padding: 12px;
  margin: 10px 0;
  font-style: italic;
  color: #606266;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.terms-container ul, .terms-container ol {
  padding-left: 20px;
  margin: 10px 0;
  line-height: 1.6;
}

.terms-container li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #606266;
  position: relative;
}

.terms-container ul li {
  list-style-type: none;
  padding-left: 5px;
}

.terms-container ul li:before {
  content: "•";
  color: #409eff;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
  font-size: 16px;
}

.terms-container ol li {
  list-style-type: decimal;
  padding-left: 5px;
}

.terms-agreement {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.terms-agreement:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.terms-agreement .el-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.terms-agreement .el-checkbox__label {
  font-weight: 500;
}

.terms-tab-pane {
  padding: 5px;
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

/* 评论操作样式 */
.comment-actions, .reply-actions {
  display: flex;
  gap: 8px;
}

.comment-actions .el-button, .reply-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 删除按钮悬停效果 */
.comment-actions .el-button[style*="color: #F56C6C"]:hover,
.reply-actions .el-button[style*="color: #F56C6C"]:hover {
  color: #ff4d4f !important;
  background-color: #fff1f0;
}

/* 收藏对话框样式 */
.favorite-dialog-content {
  padding: 20px 0;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.breadcrumb-title {
  font-weight: 600;
  color: #333;
  margin-right: 15px;
  font-size: 16px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  flex: 1;
}

.breadcrumb-item {
  cursor: pointer;
  color: #409eff;
  font-size: 14px;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
}

.breadcrumb-item:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #606266;
  cursor: default;
}

.breadcrumb-item.active:hover {
  color: #606266;
  text-decoration: none;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #c0c4cc;
}

.back-button {
  margin-left: auto;
  color: #409eff;
  font-size: 14px;
}

.back-button:hover {
  color: #66b1ff;
}

.folders-container {
  min-height: 300px;
  margin-bottom: 20px;
}

.empty-folders {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  position: relative;
}

.folder-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.folder-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.folder-item.originally-selected {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.folder-item.originally-selected.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.folder-status {
  position: absolute;
  top: 10px;
  left: 10px;
}

.folder-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.folder-name {
  font-size: 14px;
  color: #333;
  text-align: center;
  margin-bottom: 10px;
  font-weight: 500;
  word-break: break-word;
}

.folder-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.folder-item:hover .folder-actions {
  opacity: 1;
}

.open-folder-btn {
  padding: 2px 12px;
  font-size: 14px;
  font-weight: bold;
}

.open-folder-btn:hover {
  color: #007afc;
  background-color: #d7eaff;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.selected-folders {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.selected-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  margin: 0;
  font-size: 13px;
}

/* 点赞和收藏按钮样式 */
.like-section-bottom {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.like-section-bottom .el-button {
  flex: 1;
  max-width: 120px;
}
</style> 