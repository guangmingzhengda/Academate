<template>
    <div class="follow-manager">
        <!-- 关注列表内容 -->
        <div class="follow-content">
            <div class="section-card">
                <div class="card-header">
                    <h3>{{ followTab === 'following' ? '我的关注' : '我的粉丝' }}</h3>
                </div>
                
                <div class="card-content">
                    <div v-if="currentList.length === 0" class="empty-state">
                        {{ followTab === 'following' ? '暂无关注用户' : '暂无粉丝' }}
                    </div>
                    
                    <div v-else class="user-list">
                        <div 
                            v-for="user in currentPageUsers" 
                            :key="user.id" 
                            class="user-item"
                        >
                            <div class="user-info">
                                <img :src="user.avatar" alt="用户头像" class="user-avatar" @error="handleAvatarError"/>
                                <div class="user-details">
                                    <div class="user-name">{{ user.name }}</div>
                                    <div class="user-title">{{ user.title }}</div>
                                    <div class="user-organization">{{ user.organization }}</div>
                                    <div class="user-research">
                                        <span v-for="field in user.researchFields.slice(0, 3)" :key="field" class="research-tag">
                                            {{ field }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="user-actions">
                                <div class="user-stats">
                                    <span class="stat-item">{{ user.paperCount }} 论文</span>
                                    <span class="stat-item">{{ user.followersCount }} 关注者</span>
                                </div>
                                <div class="action-buttons">
                                    <el-button type="primary" plain size="small" @click="viewProfile(user.id)">
                                        查看主页
                                    </el-button>
                                    <el-button 
                                        v-if="followTab === 'following'" 
                                        type="danger" 
                                        plain 
                                        size="small" 
                                        @click="unfollowUser(user.id)"
                                    >
                                        取消关注
                                    </el-button>
                                    <el-button 
                                        v-else
                                        type="primary" 
                                        size="small" 
                                        @click="followUser(user.id)"
                                    >
                                        关注
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <el-pagination
                        v-if="currentList.length > pageSize"
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="currentList.length"
                        layout="prev, pager, next"
                        class="pagination"
                        small
                        @current-change="handlePageChange"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import { callSuccess, callInfo, callWarning } from '@/call'
import { ElMessageBox } from 'element-plus'

export default {
    name: 'followManager',
    props: {
        defaultTab: {
            type: String,
            default: 'following'
        }
    },
    setup(props) {
        // 当前选中的tab
        const followTab = ref(props.defaultTab)
        
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(5)
        
        // 关注列表数据
        const followingList = ref([
            {
                id: 1,
                name: '张教授',
                title: '教授/博士生导师',
                organization: '清华大学',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['机器学习', '深度学习', '计算机视觉'],
                paperCount: 89,
                followersCount: 1245
            },
            {
                id: 2,
                name: '李研究员',
                title: '研究员',
                organization: '中科院计算所',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['自然语言处理', '知识图谱', '人工智能'],
                paperCount: 156,
                followersCount: 892
            },
            {
                id: 3,
                name: '王博士',
                title: '副教授',
                organization: '北京大学',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['数据挖掘', '推荐系统', '机器学习'],
                paperCount: 67,
                followersCount: 534
            },
            {
                id: 4,
                name: '陈院士',
                title: '院士/教授',
                organization: '中国科学院',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['人工智能', '模式识别', '图像处理'],
                paperCount: 234,
                followersCount: 3456
            },
            {
                id: 5,
                name: '刘副教授',
                title: '副教授',
                organization: '复旦大学',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['软件工程', '系统架构', '云计算'],
                paperCount: 78,
                followersCount: 667
            },
            {
                id: 6,
                name: '赵研究员',
                title: '高级研究员',
                organization: '微软亚洲研究院',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['语音识别', '深度学习', '神经网络'],
                paperCount: 123,
                followersCount: 1089
            }
        ])
        
        // 粉丝列表数据
        const followersList = ref([
            {
                id: 11,
                name: '小明同学',
                title: '博士研究生',
                organization: '北京航空航天大学',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['机器学习', '数据分析'],
                paperCount: 12,
                followersCount: 45
            },
            {
                id: 12,
                name: '小红',
                title: '硕士研究生',
                organization: '清华大学',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['计算机视觉', '图像处理'],
                paperCount: 8,
                followersCount: 23
            },
            {
                id: 13,
                name: '小李博士',
                title: '博士后',
                organization: '中科院',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['自然语言处理', '知识图谱'],
                paperCount: 34,
                followersCount: 156
            },
            {
                id: 14,
                name: '张工程师',
                title: '高级工程师',
                organization: '百度',
                avatar: require('@/asset/home/user.png'),
                researchFields: ['深度学习', '推荐系统'],
                paperCount: 23,
                followersCount: 89
            }
        ])
        
        // 当前显示的列表
        const currentList = computed(() => {
            return followTab.value === 'following' ? followingList.value : followersList.value
        })
        
        // 当前页面的用户
        const currentPageUsers = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return currentList.value.slice(start, end)
        })
        

        
        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
        }
        
        // 头像错误处理
        const handleAvatarError = (event) => {
            event.target.src = require('@/asset/home/user.png')
        }
        
        // 查看用户主页
        const viewProfile = (userId) => {
            callInfo(`查看用户 ${userId} 的主页`)
        }
        
        // 取消关注
        const unfollowUser = async (userId) => {
            try {
                await ElMessageBox.confirm('确定要取消关注这位用户吗？', '确认操作', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = followingList.value.findIndex(user => user.id === userId)
                if (index > -1) {
                    followingList.value.splice(index, 1)
                    callSuccess('已取消关注')
                }
            } catch {
                callInfo('已取消操作')
            }
        }
        
        // 关注用户
        const followUser = (userId) => {
            callSuccess('关注成功！')
        }
        
        return {
            followTab,
            currentPage,
            pageSize,
            followingList,
            followersList,
            currentList,
            currentPageUsers,
            handlePageChange,
            handleAvatarError,
            viewProfile,
            unfollowUser,
            followUser
        }
    }
}
</script>

<style scoped>
.follow-manager {
    width: 100%;
}

/* 内容区域 */
.follow-content {
    width: 100%;
}

.section-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f2f5;
}

.card-header h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0;
}

.empty-state {
    text-align: left;
    color: #999;
    padding: 40px;
    font-size: 14px;
}

/* 用户列表样式 */
.user-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.user-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 15px;
    border: 2px solid #ddd;
}

.user-details {
    flex: 1;
}

.user-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 4px;
    text-align: left;
}

.user-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 13px;
    color: #666;
    margin-bottom: 2px;
    text-align: left;
}

.user-organization {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
    margin-bottom: 8px;
    text-align: left;
}

.user-research {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.research-tag {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid rgba(64, 158, 255, 0.3);
}

.user-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
}

.user-stats {
    display: flex;
    gap: 15px;
    margin-bottom: 5px;
}

.stat-item {
    font-family: 'Meiryo', sans-serif;
    font-size: 11px;
    color: #8e8e8e;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

/* 分页样式 */
.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .user-item {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .user-actions {
        width: 100%;
        align-items: flex-start;
    }
    
    .action-buttons {
        width: 100%;
        justify-content: flex-start;
    }
}
</style> 