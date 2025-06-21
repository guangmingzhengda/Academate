<template>
    <div class="bg-container"/>
    
    <div style="display: flex; justify-content: center; width: 100%; height: 100%;">
    <div class="profile-container">
        <div class="profile-content">
            
            <!-- 用户基本信息区域 -->
            <div class="user-basic-info">
                <div class="avatar-section">
                    <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" @error="altImg"/>
                    <div class="avatar-overlay" @click="changeAvatar">
                        <el-icon><Camera /></el-icon>
                    </div>
                </div>
                
                <div class="basic-info">
                    <div class="user-name">{{ userInfo.name }}</div>
                    <div class="user-email">{{ userInfo.email }}</div>
                    <div class="user-role">{{ userInfo.role }}</div>
                </div>
            </div>

            <!-- 学术信息区域 -->
            <div class="academic-info">
                <div class="info-card">
                    <div class="card-header">
                        <h3>学历信息</h3>
                        <el-button type="primary" plain size="small" @click="openEditDialog('education')">
                            <el-icon><Edit /></el-icon>
                            编辑
                        </el-button>
                    </div>
                    <div class="card-content">
                        <div class="info-item">
                            <span class="info-label">最高学历：</span>
                            <span class="info-value">{{ userInfo.education.degree }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">毕业院校：</span>
                            <span class="info-value">{{ userInfo.education.university }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">专业：</span>
                            <span class="info-value">{{ userInfo.education.major }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">毕业时间：</span>
                            <span class="info-value">{{ userInfo.education.graduationYear }}</span>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <div class="card-header">
                        <h3>职称信息</h3>
                        <el-button type="primary" plain size="small" @click="openEditDialog('title')">
                            <el-icon><Edit /></el-icon>
                            编辑
                        </el-button>
                    </div>
                    <div class="card-content">
                        <div class="info-item">
                            <span class="info-label">当前职称：</span>
                            <span class="info-value">{{ userInfo.title.current }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">工作单位：</span>
                            <span class="info-value">{{ userInfo.title.organization }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">部门：</span>
                            <span class="info-value">{{ userInfo.title.department }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">任职时间：</span>
                            <span class="info-value">{{ userInfo.title.startDate }}</span>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <div class="card-header">
                        <h3>研究领域</h3>
                        <el-button type="primary" plain size="small" @click="openEditDialog('research')">
                            <el-icon><Edit /></el-icon>
                            编辑
                        </el-button>
                    </div>
                    <div class="card-content">
                        <div class="info-item research-fields">
                            <span class="info-label">主要研究方向：</span>
                            <div class="research-tags">
                                <div v-for="field in userInfo.research.fields" :key="field" class="research-tag">
                                    {{ field }}
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">研究兴趣：</span>
                            <span class="info-value">{{ userInfo.research.interests }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">发表论文数：</span>
                            <span class="info-value">{{ userInfo.research.paperCount }}</span>
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

</template>

<script>
import { ref, computed } from 'vue'
import { Camera, Edit } from '@element-plus/icons-vue'
import editDialog from './components/editDialog/index.vue'
import { callSuccess, callInfo } from '@/call'

export default {
    name: 'profile',
    components: {
        editDialog
    },
    setup() {
        // 用户信息测试数据
        const userInfo = ref({
            name: 'HHH',
            email: '00000000@buaa.edu.cn',
            role: '教授/博士生导师',
            avatar: require('@/asset/home/user.png'),
            education: {
                degree: '博士',
                university: '北京航空航天大学',
                major: '计算机科学与技术',
                graduationYear: '2005年'
            },
            title: {
                current: '教授',
                organization: '北京航空航天大学',
                department: '软件学院',
                startDate: '2018年'
            },
            research: {
                fields: ['人工智能', '机器学习', '深度学习', '计算机视觉', '自然语言处理'],
                interests: '专注于深度学习在计算机视觉领域的应用研究，特别是在图像识别、目标检测和语义分割方面有深入研究。',
                paperCount: 156
            }
        })

        // 编辑对话框相关
        const editDialogVisible = ref(false)
        const editType = ref('')
        const editData = ref({})

        // 头像错误处理
        const altImg = () => {
            userInfo.value.avatar = require('@/asset/home/user.png')
        }

        // 更换头像
        const changeAvatar = () => {
            callInfo('头像更换功能开发中...')
        }

        // 打开编辑对话框
        const openEditDialog = (type) => {
            editType.value = type
            editData.value = JSON.parse(JSON.stringify(userInfo.value[type]))
            editDialogVisible.value = true
        }

        // 关闭编辑对话框
        const closeEditDialog = () => {
            editDialogVisible.value = false
            editType.value = ''
            editData.value = {}
        }

        // 保存数据
        const saveData = (type, data) => {
            userInfo.value[type] = data
            callSuccess('保存成功！')
            closeEditDialog()
        }

        return {
            userInfo,
            editDialogVisible,
            editType,
            editData,
            altImg,
            changeAvatar,
            openEditDialog,
            closeEditDialog,
            saveData
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
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

.user-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 32px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 10px;
}

.user-email {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    color: #409eff;
    margin-bottom: 8px;
}

.user-role {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    color: #7f8c8d;
    background-color: rgba(64, 158, 255, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    display: inline-block;
}

/* 学术信息区域 */
.academic-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
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
}

.info-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #2c3e50;
    flex: 1;
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
@media (max-width: 768px) {
    .user-basic-info {
        flex-direction: column;
        text-align: center;
        padding: 30px 20px;
    }
    
    .avatar-section {
        margin-right: 0;
        margin-bottom: 20px;
    }
    
    .academic-info {
        grid-template-columns: 1fr;
    }
    
    .info-card {
        padding: 20px;
    }
}
</style> 