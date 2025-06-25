<template>
    <div class="bg-container"/>
    
    <div style="display: flex; justify-content: center; width: 100%; height: 100%;">
    <div class="profile-container">
        <div class="profile-content">
            
            <!-- 用户基本信息区域 -->
            <div class="user-basic-info">
                <!-- 加载状态 -->
                <div v-if="loading" class="loading-overlay">
                    <el-icon class="is-loading" style="font-size: 24px; color: #409eff;">
                        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0l135.744 135.744a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0l135.744 135.744a32 32 0 0 1-45.248 45.248L647.744 692.736a32 32 0 0 1 0-45.248zM828.8 195.2a32 32 0 0 1-45.248 0L647.744 331.008a32 32 0 0 1 45.248-45.248L828.8 149.952a32 32 0 0 1 0 45.248zM376.256 692.736a32 32 0 0 1-45.248 0L195.2 828.8a32 32 0 0 1 45.248-45.248L376.256 647.744a32 32 0 0 1 0 45.248z"/>
                        </svg>
                    </el-icon>
                    <p>正在加载用户信息...</p>
                </div>
                
                <div class="avatar-section">
                    <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" @error="altImg"/>
                    <div v-if="isOwnProfile" class="avatar-overlay" @click="changeAvatar">
                        <el-icon><Camera /></el-icon>
                    </div>
                </div>
                
                <div class="basic-info">
                    <div class="name-follow-row">
                        <div class="user-name">{{ userInfo.name || '姓名未知' }}{{ userInfo.account ? ` (${userInfo.account})` : '(\'加载中...\')' }}</div>
                        <div class="action-buttons">
                            <el-button 
                                class="edit-profile-btn"
                                type="primary" 
                                size="small"
                                @click="openEditProfileDialog"
                                :disabled="loading"
                                v-if="isOwnProfile"
                            >
                                编辑资料
                            </el-button>
                            <el-button 
                                class="follow-btn"
                                :class="{ 'is-info': isFollowing }"
                                @click="toggleFollow"
                                :disabled="loading"
                                v-if="!isOwnProfile"
                            >
                                {{ isFollowing ? '已关注' : '+关注' }}
                            </el-button>
                            <el-button 
                                class="message-btn"
                                type="primary" 
                                plain
                                size="small"
                                @click="sendMessage"
                                :disabled="loading"
                                v-if="!isOwnProfile"
                            >
                                私信
                            </el-button>
                        </div>
                    </div>
                    <div class="user-email">{{ userInfo.email || '未填写' }}</div>
                    <div class="user-profile">{{ userInfo.profile || '这个人很神秘，什么都没有留下~' }}</div>
                </div>

                <div class="stats-section">
                    <div class="stat-item">
                        <span class="stat-number">{{ userInfo.followersCount }}</span>
                        <span class="stat-label">关注者</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">{{ userInfo.likesCount }}</span>
                        <span class="stat-label">获赞</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">{{ userInfo.research.paperCount }}</span>
                        <span class="stat-label">成果</span>
                    </div>
                </div>
            </div>

                            <!-- 主要内容区域 -->
                <div class="main-content">
                    <!-- 左侧学术信息 -->
                    <div class="left-sidebar">
                        <div class="info-card">
                            <div class="card-header">
                                <h3>学历信息</h3>
                                <el-button type="primary" plain size="small" @click="openEditDialog('education')" v-if="isOwnProfile">
                                    <el-icon><Edit /></el-icon>
                                    编辑
                                </el-button>
                            </div>
                            <div class="card-content">
                                <div class="info-item">
                                    <span class="info-label">最高学历：</span>
                                    <span class="info-value">{{ userInfo.education.degree || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">毕业院校：</span>
                                    <span class="info-value">{{ userInfo.education.university || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">专业：</span>
                                    <span class="info-value">{{ userInfo.education.major || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">毕业时间：</span>
                                    <span class="info-value">{{ formatGraduationDate(userInfo.education.graduationYear) || '未填写' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="card-header">
                                <h3>职称信息</h3>
                                <el-button type="primary" plain size="small" @click="openEditDialog('title')" v-if="isOwnProfile">
                                    <el-icon><Edit /></el-icon>
                                    编辑
                                </el-button>
                            </div>
                            <div class="card-content">
                                <div class="info-item">
                                    <span class="info-label">当前职称：</span>
                                    <span class="info-value">{{ userInfo.title.current || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">工作单位：</span>
                                    <span class="info-value">{{ userInfo.title.organization || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">部门：</span>
                                    <span class="info-value">{{ userInfo.title.department || '未填写' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="card-header">
                                <h3>研究领域</h3>
                                <el-button type="primary" plain size="small" @click="openEditDialog('research')" v-if="isOwnProfile">
                                    <el-icon><Edit /></el-icon>
                                    编辑
                                </el-button>
                            </div>
                            <div class="card-content">
                                <div class="info-item">
                                    <span class="info-label">主要研究领域：</span>
                                    <span class="info-value">{{ userInfo.research.fields || '未填写' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">学术成果数：</span>
                                    <span class="info-value">{{ userInfo.research.paperCount }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧管理区域 -->
                    <div class="right-content">
                        <!-- 翻页选项 -->
                        <div class="tab-selector">
                            <div class="tab-buttons">
                                <button 
                                    v-for="tab in tabs" 
                                    :key="tab.key"
                                    :class="['tab-button', { active: activeTab === tab.key }]"
                                    @click="switchTab(tab.key)"
                                >
                                    {{ tab.label }}
                                </button>
                            </div>
                        </div>

                        <!-- 内容区域 -->
                        <div class="tab-content">
                            <!-- 项目/学术成果 -->
                            <div v-if="activeTab === 'projects'" class="tab-panel">
                                <project-manager :user-id="userId" />
                                <achievement-manager :research-outcomes="userInfo.research.researchOutcomes" @refresh="fetchUserDetail" />
                            </div>
                            
                            <!-- 关注列表 -->
                            <div v-if="activeTab === 'following'" class="tab-panel">
                                <follow-manager :default-tab="'following'" :user-id="userId" :is-own-profile="isOwnProfile"/>
                            </div>
                            
                            <!-- 被关注列表 -->
                            <div v-if="activeTab === 'followers'" class="tab-panel">
                                <follow-manager :default-tab="'followers'" :user-id="userId" :is-own-profile="isOwnProfile"/>
                            </div>
                            
                            <!-- 我的文献库 -->
                            <div v-if="activeTab === 'library'" class="tab-panel">
                                <library-manager />
                            </div>
                        </div>
                    </div>
                </div>

        </div>
    </div>
    </div>
    <!-- 编辑对话框 -->
    <edit-dialog 
        :visible="editDialogVisible" 
        :type="editType" 
        :data="editData"
        @close="closeEditDialog"
        @save="saveData"
    />

    <!-- 发送私信对话框 -->
    <el-dialog
        v-model="messageDialogVisible"
        title=""
        width="500px"
        @close="closeMessageDialog"
    >
        <div class="message-dialog">
            <div class="recipient-info">
                <img :src="userInfo.avatar" alt="头像" class="recipient-avatar" @error="altImg"/>
                <div>
                    <div class="recipient-name">{{ userInfo.name || '姓名未知' }}</div>
                    <div class="recipient-org">{{ userInfo.email || '未填写' }}</div>
                </div>
            </div>
            
            <el-form>
                <el-form-item label="消息内容" required>
                    <el-input
                        v-model="messageContent"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入您要发送的消息内容..."
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <el-button @click="closeMessageDialog">取消</el-button>
            <el-button type="primary" @click="sendPrivateMessage" :disabled="!messageContent.trim()">
                发送
            </el-button>
        </template>
    </el-dialog>

    <!-- 编辑资料对话框 -->
    <el-dialog
        v-model="editProfileDialogVisible"
        title="编辑个人资料"
        width="600px"
        @close="closeEditProfileDialog"
    >
        <div class="edit-profile-dialog">
            <el-form :model="editProfileForm" label-width="100px">
                <el-form-item label="真实姓名" required>
                    <el-input
                        v-model="editProfileForm.name"
                        placeholder="请输入您的真实姓名"
                        maxlength="50"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="用户名" required>
                    <el-input
                        v-model="editProfileForm.account"
                        placeholder="请输入您的用户名"
                        maxlength="30"
                        show-word-limit
                        :disabled="!!editProfileForm.account"
                    />
                </el-form-item>
                <el-form-item label="个人简介">
                    <el-input
                        v-model="editProfileForm.profile"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入您的个人简介..."
                        maxlength="200"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <el-button @click="closeEditProfileDialog">取消</el-button>
            <el-button type="primary" @click="saveProfile" :disabled="!editProfileForm.name.trim() || !editProfileForm.account.trim()">
                保存
            </el-button>
        </template>
    </el-dialog>

</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { Camera, Edit, Plus, Check } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import editDialog from './components/editDialog/index.vue'
import projectManager from './components/projectManager/index.vue'
import achievementManager from './components/achievementManager/index.vue'
import followManager from './components/followManager/index.vue'
import libraryManager from './components/libraryManager/index.vue'
import { callSuccess, callInfo, callError } from '@/call'
import { ElMessage } from 'element-plus'
import { get_user_detail, upload_user_avatar, update_user_info, get_user_projects } from '@/api/profile'
import { followUser, unfollowUser, getFollowedUsers } from '@/api/follow'
import store from '@/store'

export default {
    name: 'profile',
    components: {
        editDialog,
        projectManager,
        achievementManager,
        followManager,
        libraryManager
    },
    setup() {
        const route = useRoute();
        const userId = computed(() => Number(route.params.id));
        
        // 用户信息
        const userInfo = ref({
            name: '',
            email: '',
            profile: '',
            avatar: require('@/asset/home/user.png'),
            followersCount: 0,
            likesCount: 0,
            education: {
                degree: '',
                university: '',
                major: '',
                graduationYear: ''
            },
            title: {
                current: '',
                organization: '',
                department: ''
            },
            research: {
                fields: '',
                paperCount: 0,
                researchOutcomes: []
            }
        })

        // 判断是否是当前登录用户的页面
        const isOwnProfile = computed(() => {
            const currentUserId = route.params.id;
            const loginUserId = store.getters.getData?.id;
            return currentUserId && loginUserId && parseInt(currentUserId) === loginUserId;
        })

        // 加载状态
        const loading = ref(false)

        // 静态项目数据
        const userProjects = ref([
            {
                id: 1,
                name: '智能教育平台开发',
                description: '基于人工智能技术的个性化教育平台，支持自适应学习和智能推荐功能。',
                startDate: '2023-01-15',
                endDate: '2023-12-31',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 2,
                name: '深度学习算法优化研究',
                description: '针对计算机视觉领域的深度学习算法进行性能优化和准确性提升研究。',
                startDate: '2022-06-01',
                endDate: '2023-05-31',
                status: '已完成',
                leader: 'HHH'
            },
            {
                id: 3,
                name: '知识图谱构建系统',
                description: '构建面向特定领域的知识图谱系统，实现知识的自动抽取和推理。',
                startDate: '2023-09-01',
                endDate: '2024-08-31',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 4,
                name: '智能推荐系统优化',
                description: '基于用户行为分析的智能推荐算法研究与实现。',
                startDate: '2023-03-01',
                endDate: '2024-02-29',
                status: '进行中',
                leader: 'HHH'
            }
        ]);

        // 获取用户详细信息
        const fetchUserDetail = async () => {
            // 从路由参数获取用户ID
            let userId = route.params.id;
            
            if (!userId) {
                callError('用户ID不存在，请重新登录')
                return
            }

            loading.value = true
            // 重置关注状态
            isFollowing.value = false
            // 重置编辑对话框状态
            editDialogVisible.value = false
            editType.value = ''
            editData.value = {}
            // 重置私信对话框状态
            messageDialogVisible.value = false
            messageContent.value = ''
            // 重置编辑资料对话框状态
            editProfileDialogVisible.value = false
            
            try {
                const userDetail = await get_user_detail({ userId: parseInt(userId) })
                if (userDetail) {
                    // 更新用户信息
                    userInfo.value = {
                        name: userDetail.name || '',
                        account: userDetail.account || '',
                        email: userDetail.email || '',
                        profile: userDetail.profile || '',
                        avatar: userDetail.avatar || require('@/asset/home/user.png'),
                        followersCount: userDetail.followersCount || 0,
                        likesCount: userDetail.totalOutcomeLikes || 0,
                        education: {
                            degree: userDetail.highestDegree || '',
                            university: userDetail.graduateSchool || '',
                            major: userDetail.major || '',
                            graduationYear: userDetail.graduationDate || ''
                        },
                        title: {
                            current: userDetail.jobTitle || '',
                            organization: userDetail.institution || '',
                            department: userDetail.department || ''
                        },
                        research: {
                            fields: userDetail.field || '',
                            paperCount: userDetail.researchOutcomes ? userDetail.researchOutcomes.length : 0,
                            researchOutcomes: userDetail.researchOutcomes || []
                        }
                    }
                    
                    callSuccess('用户信息加载成功')
                }
            } catch (error) {
                callError('获取用户信息失败')
                console.error('获取用户信息失败:', error)
            } finally {
                loading.value = false
            }
        }

        // 页面加载时获取用户信息
        onMounted(() => {
            fetchUserDetail()
        })

        // 监听路由参数变化，当用户ID变化时重新获取用户信息
        watch(() => route.params.id, (newId, oldId) => {
            if (newId !== oldId) {
                fetchUserDetail()
            }
        })

        // 编辑对话框相关
        const editDialogVisible = ref(false)
        const editType = ref('')
        const editData = ref({})

        // 关注相关
        const isFollowing = ref(false)
        // 当前登录用户id
        const currentUserId = computed(() => store.getters.getData?.id)

        // 检查是否已关注
        const checkIsFollowing = async () => {
            if (!currentUserId.value || !userId.value) {
                isFollowing.value = false;
                return;
            }
            const res = await getFollowedUsers(currentUserId.value, 1, 1000)
            if (res && Array.isArray(res.records)) {
                isFollowing.value = res.records.some(u => u.userId === userId.value)
            } else {
                isFollowing.value = false
            }
        }

        watch(userId, checkIsFollowing, { immediate: true })

        // 私信相关
        const messageDialogVisible = ref(false)
        const messageContent = ref('')

        // 标签页相关
        const activeTab = ref('projects')
        const tabs = [
            { key: 'projects', label: '项目/学术成果' },
            { key: 'following', label: '关注列表' },
            { key: 'followers', label: '被关注列表' },
            { key: 'library', label: '文献库' }
        ]

        // 头像错误处理
        const altImg = () => {
            userInfo.value.avatar = require('@/asset/home/user.png')
        }

        // 更换头像
        const changeAvatar = () => {
            // 创建文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            // 监听文件选择
            fileInput.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                // 验证文件类型
                if (!file.type.startsWith('image/')) {
                    callError('请选择图片文件');
                    return;
                }
                
                // 验证文件大小（限制为5MB）
                if (file.size > 5 * 1024 * 1024) {
                    callError('图片大小不能超过5MB');
                    return;
                }
                
                try {
                    // 显示上传中状态
                    callInfo('正在上传头像...');
                    
                    // 调用上传API
                    const avatarUrl = await upload_user_avatar(file);
                    
                    if (avatarUrl) {
                        // 更新本地显示
                        userInfo.value.avatar = avatarUrl;
                        
                        // 强制刷新store中的头像信息
                        let currentData = store.getters.getData || {};
                        currentData = { ...currentData, avatar: avatarUrl };
                        store.commit('setData', currentData);
                        
                        // 触发全局事件，通知导航栏更新头像
                        window.dispatchEvent(new CustomEvent('avatarUpdated', {
                            detail: { avatarUrl }
                        }));
                        
                        callSuccess('头像上传成功！');
                    }
                } catch (error) {
                    callError('头像上传失败');
                    console.error('头像上传失败:', error);
                }
                
                // 清理文件输入元素
                document.body.removeChild(fileInput);
            };
            
            // 添加到DOM并触发点击
            document.body.appendChild(fileInput);
            fileInput.click();
        }

        // 打开编辑对话框
        const openEditDialog = (type) => {
            editType.value = type;
            
            // 根据类型准备数据
            let dialogData = {};
            if (type === 'education') {
                dialogData = {
                    highestDegree: userInfo.value.education.degree,
                    graduateSchool: userInfo.value.education.university,
                    major: userInfo.value.education.major,
                    graduationDate: formatGraduationDateForEdit(userInfo.value.education.graduationYear)
                };
            } else if (type === 'title') {
                dialogData = {
                    jobTitle: userInfo.value.title.current,
                    institution: userInfo.value.title.organization,
                    department: userInfo.value.title.department
                };
            } else if (type === 'research') {
                dialogData = {
                    field: userInfo.value.research.fields,
                    paperCount: userInfo.value.research.paperCount
                };
            }
            
            editData.value = dialogData;
            editDialogVisible.value = true;
        }

        // 关闭编辑对话框
        const closeEditDialog = () => {
            editDialogVisible.value = false
            editType.value = ''
            editData.value = {}
        }

        // 保存数据
        const saveData = async (type, data) => {
            try {
                let updateData = {};
                
                // 根据编辑类型构建更新数据
                if (type === 'education') {
                    updateData = {
                        highestDegree: data.highestDegree,
                        graduateSchool: data.graduateSchool,
                        major: data.major,
                        graduationDate: data.graduationDate
                    };
                } else if (type === 'title') {
                    updateData = {
                        jobTitle: data.jobTitle,
                        institution: data.institution,
                        department: data.department
                    };
                } else if (type === 'research') {
                    updateData = {
                        field: data.field
                    };
                }
                
                // 调用API更新信息
                const success = await update_user_info(updateData);
                
                if (success) {
                    // 更新本地显示
                    if (type === 'education') {
                        userInfo.value.education = {
                            degree: data.highestDegree,
                            university: data.graduateSchool,
                            major: data.major,
                            graduationYear: data.graduationDate
                        };
                    } else if (type === 'title') {
                        userInfo.value.title = {
                            current: data.jobTitle,
                            organization: data.institution,
                            department: data.department
                        };
                    } else if (type === 'research') {
                        userInfo.value.research.fields = data.field;
                    }
                    
                    callSuccess('保存成功！');
                    closeEditDialog();
                }
            } catch (error) {
                callError('保存失败，请重试');
                console.error('保存信息失败:', error);
            }
        }

        // 切换关注状态
        const toggleFollow = async () => {
            if (!isFollowing.value) {
                // 关注
                const ok = await followUser(userId.value)
                if (ok) {
                    isFollowing.value = true
                    userInfo.value.followersCount++
                }
            } else {
                // 取消关注
                const ok = await unfollowUser(userId.value)
                if (ok) {
                    isFollowing.value = false
                    userInfo.value.followersCount--
                }
            }
        }

        // 切换标签页
        const switchTab = (tabKey) => {
            activeTab.value = tabKey
        }

        // 发送私信
        const sendMessage = () => {
            messageDialogVisible.value = true
        }

        // 关闭私信对话框
        const closeMessageDialog = () => {
            messageDialogVisible.value = false
            messageContent.value = ''
        }

        // 发送私信内容（模拟，实际可调用API）
        const sendPrivateMessage = () => {
            if (!messageContent.value.trim()) {
                callInfo('请输入消息内容')
                return
            }
            // TODO: 调用实际私信API
            callSuccess(`私信已发送给 ${userInfo.value.name}`)
            messageDialogVisible.value = false
            messageContent.value = ''
        }

        // 编辑资料对话框相关
        const editProfileDialogVisible = ref(false)
        const editProfileForm = ref({
            name: '',
            account: '',
            profile: ''
        })

        // 打开编辑资料对话框
        const openEditProfileDialog = () => {
            editProfileForm.value = {
                name: userInfo.value.name || '',
                account: userInfo.value.account || '',
                profile: userInfo.value.profile || ''
            }
            editProfileDialogVisible.value = true
        }

        // 保存编辑资料
        const saveProfile = async () => {
            try {
                // 调用API更新个人信息
                const success = await update_user_info({
                    name: editProfileForm.value.name,
                    userProfile: editProfileForm.value.profile,
                    // 注意：这里只更新姓名和个人简介，因为其他字段在编辑资料对话框中不可编辑
                });
                
                if (success) {
                    // 更新本地显示
                    userInfo.value.name = editProfileForm.value.name;
                    userInfo.value.profile = editProfileForm.value.profile;
                    
                    callSuccess('个人资料编辑成功');
                    closeEditProfileDialog();
                }
            } catch (error) {
                callError('保存失败，请重试');
                console.error('保存个人信息失败:', error);
            }
        }

        // 关闭编辑资料对话框
        const closeEditProfileDialog = () => {
            editProfileDialogVisible.value = false
            editProfileForm.value = {
                name: '',
                account: '',
                profile: ''
            }
        }

        // 格式化毕业日期
        const formatGraduationDate = (date) => {
            if (!date) return null;
            // 处理完整的date-time格式，只提取年月
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}`;
            }
            // 如果已经是YYYY-MM格式，直接返回
            if (date.includes('-') && date.split('-').length === 2) {
                return date;
            }
            return null;
        };

        // 格式化毕业日期用于编辑
        const formatGraduationDateForEdit = (date) => {
            if (!date) return null;
            // 处理完整的date-time格式，只提取年月
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}`;
            }
            // 如果已经是YYYY-MM格式，直接返回
            if (date.includes('-') && date.split('-').length === 2) {
                return date;
            }
            return null;
        };

        return {
            userInfo,
            loading,
            fetchUserDetail,
            editDialogVisible,
            editType,
            editData,
            isFollowing,
            messageDialogVisible,
            messageContent,
            activeTab,
            tabs,
            altImg,
            changeAvatar,
            openEditDialog,
            closeEditDialog,
            saveData,
            toggleFollow,
            switchTab,
            sendMessage,
            closeMessageDialog,
            sendPrivateMessage,
            editProfileDialogVisible,
            editProfileForm,
            openEditProfileDialog,
            saveProfile,
            closeEditProfileDialog,
            formatGraduationDate,
            formatGraduationDateForEdit,
            isOwnProfile,
            userProjects,
            userId
        }
    }
}
</script>

<style scoped>
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

.profile-container {
    min-height: 100vh;
    margin-top: 100px;
    display: flex;
    justify-content: center;
    width: 1200px;
}

.profile-content {
    max-width: 1600px;
    width: 100%;
}

/* 用户基本信息 */
.user-basic-info {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 40px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: relative;
}

/* 加载状态覆盖层 */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 0;
}

.loading-overlay p {
    margin-top: 10px;
    font-family: 'Meiryo', sans-serif;
    color: #409eff;
    font-size: 14px;
}

/* 旋转动画 */
.is-loading {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.avatar-section {
    position: relative;
    margin-right: 40px;
}

.user-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #409eff;
    transition: all 0.3s ease;
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.avatar-section:hover .avatar-overlay {
    opacity: 1;
}

.avatar-overlay .el-icon {
    color: white;
    font-size: 24px;
}

.basic-info {
    flex: 1;
}

.name-follow-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.user-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 32px;
    font-weight: bold;
    color: #2c3e50;
    text-align: left;
    margin: 0;
}

.user-email {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    color: #409eff;
    margin-bottom: 8px;
    text-align: left;
}

.user-profile {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #7f8c8d;
    margin-top: 8px;
    line-height: 1.4;
    max-width: 400px;
    word-wrap: break-word;
    text-align: left;
}

/* 关注按钮 */
.follow-btn {
    font-family: 'Meiryo', sans-serif;
    border-radius: 16px;
    padding: 6px 16px;
    font-size: 13px;
    transition: all 0.3s ease;
    border: 1px solid #d0d0d0;
    background-color: #f5f5f5;
    color: #666;
    height: 32px;
}

.follow-btn:hover {
    background-color: #e8e8e8;
    border-color: #bbb;
    transform: translateY(-1px);
}

.follow-btn.is-info {
    background-color: #909399;
    border-color: #909399;
    color: white;
}

.follow-btn.is-info:hover {
    background-color: #82848a;
    border-color: #82848a;
}

/* 私信按钮 - 与关注按钮样式一致 */
.message-btn {
    font-family: 'Meiryo', sans-serif;
    border-radius: 16px;
    padding: 6px 16px;
    font-size: 13px;
    transition: all 0.3s ease;
    border: 1px solid #d0d0d0;
    background-color: #f5f5f5;
    color: #666;
    height: 32px;
}

.message-btn:hover {
    background-color: #e8e8e8;
    border-color: #bbb;
    transform: translateY(-1px);
}

/* 编辑资料按钮 */
.edit-profile-btn {
    font-family: 'Meiryo', sans-serif;
    border-radius: 16px;
    padding: 6px 16px;
    font-size: 13px;
    transition: all 0.3s ease;
    border: 1px solid #409eff;
    background-color: #409eff;
    color: white;
    height: 32px;
}

.edit-profile-btn:hover {
    background-color: #337ecc;
    border-color: #337ecc;
    transform: translateY(-1px);
}

/* 统计信息区域 */
.stats-section {
    display: flex;
    align-items: center;
    gap: 30px;
    margin-left: 20px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-number {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1;
}

.stat-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
    margin-top: 4px;
}

/* 主要内容区域 */
.main-content {
    display: flex;
    gap: 10px;
    width: 100%;
}

/* 左侧学术信息栏 */
.left-sidebar {
    width: 350px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 右侧内容区域 */
.right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 标签页选择器 */
.tab-selector {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 5px;
}

.tab-buttons {
    display: flex;
    gap: 0;
}

.tab-button {
    flex: 1;
    padding: 12px 20px;
    border: none;
    background-color: transparent;
    color: #666;
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 0;
}

.tab-button:hover {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
}

.tab-button.active {
    background-color: #409eff;
    color: white;
    font-weight: bold;
}

.tab-content {
    width: 100%;
}

.tab-panel {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.info-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
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

.card-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.info-item {
    display: flex;
    align-items: flex-start;
}

.info-item.research-fields {
    flex-direction: column;
    align-items: flex-start;
}

.info-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #5a6c7d;
    font-weight: 600;
    min-width: 100px;
    margin-right: 10px;
    text-align: left;
}

.info-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #2c3e50;
    flex: 1;
    text-align: left;
}

.research-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.research-tag {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(64, 158, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .main-content {
        flex-direction: column;
    }
    
    .left-sidebar {
        width: 100%;
    }
    
    .right-content {
        width: 100%;
    }
}

@media (max-width: 768px) {
    .user-basic-info {
        flex-direction: column;
        text-align: left;
        padding: 30px 20px;
    }
    
    .avatar-section {
        margin-right: 0;
        margin-bottom: 20px;
    }
    
    .name-follow-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .user-name {
        font-size: 24px;
    }
    
    .stats-section {
        margin-left: 0;
        gap: 20px;
        margin-top: 15px;
        justify-content: center;
    }
    
    .stat-number {
        font-size: 16px;
    }
    
    .stat-label {
        font-size: 11px;
    }
    
    .follow-btn {
        padding: 6px 14px;
        font-size: 12px;
        height: 28px;
    }
    
    .info-card {
        padding: 20px;
    }
}

/* 私信对话框样式 */
.message-dialog {
    padding: 20px 0;
}

.recipient-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.recipient-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
}

.recipient-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: left;
}

.recipient-org {
    font-size: 14px;
    color: #666;
    text-align: left;
}
</style> 