<template>
    <div class="achievement-manager">
        <div class="manager-card">
            <div class="card-header">
                <h3>学术成果</h3>
                <div class="header-actions">
                    <el-button type="warning" plain @click="openSelectDialog">
                        <el-icon><Search /></el-icon>
                        从库中选择
                    </el-button>
                    <el-button type="success" plain @click="openExcelUploadDialog">
                        <el-icon><Upload /></el-icon>
                        Excel导入
                    </el-button>
                    <el-button type="primary" @click="openAddDialog">
                        <el-icon><Plus /></el-icon>
                        添加成果
                    </el-button>
                </div>
            </div>
            
            <div class="card-content">
                <div v-if="achievements.length === 0" class="empty-state">
                    暂无学术成果数据
                </div>
                
                <div v-else class="achievement-list">
                    <div 
                        v-for="achievement in currentPageAchievements" 
                        :key="achievement.id" 
                        class="achievement-item"
                    >
                        <div class="achievement-info">
                            <div class="achievement-header">
                                <div class="title-type-row">
                                    <span class="achievement-type-tag" :class="achievement.type">
                                        {{ typeLabels[achievement.type] }}
                                    </span>
                                    <div class="achievement-title">{{ achievement.title }}</div>
                                </div>
                                <div class="achievement-actions">
                                    <el-button type="primary" link @click="editAchievement(achievement)">
                                        <el-icon><Edit /></el-icon>
                                        编辑
                                    </el-button>
                                    <el-button type="danger" link @click="deleteAchievement(achievement.id)">
                                        <el-icon><Delete /></el-icon>
                                        删除
                                    </el-button>
                                </div>
                            </div>
                            <div class="achievement-meta">
                                <div class="meta-row">
                                    <span class="meta-label">作者：</span>
                                    <span class="meta-value">{{ achievement.authors || '暂无' }}</span>
                                    <span v-if="achievement.publishDate" class="meta-label">发表时间：</span>
                                    <span v-if="achievement.publishDate" class="meta-value">{{ achievement.publishDate }}</span>
                                </div>
                                <div v-if="achievement.journal || achievement.conference || achievement.patentNumber" class="meta-row">
                                    <span v-if="achievement.journal" class="meta-label">期刊：</span>
                                    <span v-if="achievement.journal" class="meta-value">{{ achievement.journal }}</span>
                                    <span v-if="achievement.conference" class="meta-label">会议：</span>
                                    <span v-if="achievement.conference" class="meta-value">{{ achievement.conference }}</span>
                                    <span v-if="achievement.patentNumber" class="meta-label">专利号：</span>
                                    <span v-if="achievement.patentNumber" class="meta-value">{{ achievement.patentNumber }}</span>
                                </div>
                                <div v-if="achievement.volume || achievement.issue || achievement.pages" class="meta-row">
                                    <span v-if="achievement.volume || achievement.issue" class="meta-label">卷期：</span>
                                    <span v-if="achievement.volume || achievement.issue" class="meta-value">第{{ achievement.volume }}卷 第{{ achievement.issue }}期</span>
                                    <span v-if="achievement.pages" class="meta-label">页码：</span>
                                    <span v-if="achievement.pages" class="meta-value">{{ achievement.pages }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 分页 -->
                <el-pagination
                    v-if="achievements.length > pageSize"
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    :total="achievements.length"
                    layout="prev, pager, next, jumper, total"
                    class="pagination"
                    small
                    @current-change="handlePageChange"
                />
            </div>
        </div>

        <!-- Excel上传对话框 -->
        <el-dialog 
            v-model="excelDialogVisible" 
            title=""
            width="800px"
            @close="closeExcelDialog"
        >
            <div class="excel-upload-section">
                <div class="upload-tips">
                    <h4>导入说明：</h4>
                    <ul>
                        <li>请上传Excel文件（.xlsx或.xls格式）</li>
                        <li>表格应包含两列：第一列为字段名称，第二列为对应内容</li>
                        <li>支持的字段名称包括：成果类型、标题、作者、期刊名称、会议名称、专利号、卷号、期号、页码、发表时间、DOI、摘要等</li>
                        <li>导入后可在表单中进一步编辑和完善信息</li>
                    </ul>
                </div>

                <el-upload
                    ref="excelUploadRef"
                    :auto-upload="false"
                    :on-change="handleExcelChange"
                    :before-upload="beforeExcelUpload"
                    accept=".xlsx,.xls"
                    drag
                    :limit="1"
                    class="excel-upload"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将Excel文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            只能上传xlsx/xls文件，且不超过10MB
                        </div>
                    </template>
                </el-upload>

                <div v-if="excelPreviewData.length > 0" class="preview-section">
                    <h4 style="text-align: left; margin-left: 10px;">预览数据：</h4>
                    <el-table :data="excelPreviewData" border style="width: 100%" max-height="300">
                        <el-table-column prop="field" label="字段名称" width="200" />
                        <el-table-column prop="value" label="内容" />
                    </el-table>
                </div>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeExcelDialog">取消</el-button>
                    <el-button 
                        type="primary" 
                        @click="importExcelData"
                        :disabled="excelPreviewData.length === 0"
                    >
                        导入到表单
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 从库中选择学术成果对话框 -->
        <el-dialog 
            v-model="selectDialogVisible" 
            title=""
            width="1000px"
            @close="closeSelectDialog"
        >
            <div class="select-achievement-section">
                <div class="search-header">
                    <h4>从学术成果库中选择</h4>
                    <div class="search-controls">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索标题、作者或期刊..."
                            style="width: 300px;"
                            clearable
                            @input="handleSearch"
                        >
                            <template #prefix>
                                <el-icon><Search /></el-icon>
                            </template>
                        </el-input>
                    </div>
                </div>

                <div class="achievement-library">
                    <div v-if="filteredLibraryAchievements.length === 0" class="empty-library">
                        <el-empty description="没有找到匹配的学术成果" />
                    </div>
                    
                    <div v-else class="library-list">
                        <div 
                            v-for="achievement in currentPageLibraryAchievements" 
                            :key="achievement.id" 
                            class="library-item"
                            :class="{ selected: selectedAchievements.includes(achievement.id) }"
                            @click="toggleSelection(achievement.id)"
                        >
                            <div class="library-item-content">
                                <div class="library-header">
                                    <div class="title-type-row">
                                        <span class="achievement-type-tag" :class="achievement.type">
                                            {{ typeLabels[achievement.type] }}
                                        </span>
                                        <div class="library-title">{{ achievement.title }}</div>
                                    </div>
                                    <el-checkbox 
                                        :model-value="selectedAchievements.includes(achievement.id)"
                                        @change="toggleSelection(achievement.id)"
                                        @click.stop
                                    />
                                </div>
                                <div class="library-meta">
                                    <div class="meta-row">
                                        <span class="meta-label">作者：</span>
                                        <span class="meta-value">{{ achievement.authors || '暂无' }}</span>
                                        <span v-if="achievement.publishDate" class="meta-label">发表时间：</span>
                                        <span v-if="achievement.publishDate" class="meta-value">{{ achievement.publishDate }}</span>
                                    </div>
                                    <div v-if="achievement.journal || achievement.conference" class="meta-row">
                                        <span v-if="achievement.journal" class="meta-label">期刊：</span>
                                        <span v-if="achievement.journal" class="meta-value">{{ achievement.journal }}</span>
                                        <span v-if="achievement.conference" class="meta-label">会议：</span>
                                        <span v-if="achievement.conference" class="meta-value">{{ achievement.conference }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <el-pagination
                        v-if="filteredLibraryAchievements.length > libraryPageSize"
                        v-model:current-page="libraryCurrentPage"
                        :page-size="libraryPageSize"
                        :total="filteredLibraryAchievements.length"
                        layout="prev, pager, next, jumper, total"
                        class="library-pagination"
                        small
                        @current-change="handleLibraryPageChange"
                    />
                </div>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <div class="selected-count">
                        已选择 {{ selectedAchievements.length }} 项
                    </div>
                    <div class="footer-actions">
                        <el-button @click="closeSelectDialog">取消</el-button>
                        <el-button 
                            type="primary" 
                            @click="addSelectedAchievements"
                            :disabled="selectedAchievements.length === 0"
                        >
                            添加选中项 ({{ selectedAchievements.length }})
                        </el-button>
                    </div>
                </div>
            </template>
        </el-dialog>

        <!-- 添加/编辑学术成果对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            title=""
            width="700px"
        >
            <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
                <el-form-item label="成果类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择成果类型" style="width: 100%;" @change="onTypeChange">
                        <el-option label="期刊论文" value="journal" />
                        <el-option label="会议论文" value="conference" />
                        <el-option label="专利" value="patent" />
                        <el-option label="专著" value="book" />
                        <el-option label="软件著作权" value="software" />
                    </el-select>
                </el-form-item>
                
                <el-form-item label="标题" prop="title">
                    <el-input v-model="formData.title" placeholder="请输入成果标题" />
                </el-form-item>
                
                <el-form-item label="作者" prop="authors">
                    <el-input v-model="formData.authors" placeholder="请输入作者信息，多个作者用逗号分隔" />
                </el-form-item>

                <!-- 期刊论文字段 -->
                <template v-if="formData.type === 'journal'">
                    <el-form-item label="期刊名称" prop="journal">
                        <el-input v-model="formData.journal" placeholder="请输入期刊名称" />
                    </el-form-item>
                    <el-form-item label="卷号" prop="volume">
                        <el-input v-model="formData.volume" placeholder="请输入卷号" />
                    </el-form-item>
                    <el-form-item label="期号" prop="issue">
                        <el-input v-model="formData.issue" placeholder="请输入期号" />
                    </el-form-item>
                    <el-form-item label="页码" prop="pages">
                        <el-input v-model="formData.pages" placeholder="例如：123-130" />
                    </el-form-item>
                </template>

                <!-- 会议论文字段 -->
                <template v-if="formData.type === 'conference'">
                    <el-form-item label="会议名称" prop="conference">
                        <el-input v-model="formData.conference" placeholder="请输入会议名称" />
                    </el-form-item>
                    <el-form-item label="会议地点" prop="location">
                        <el-input v-model="formData.location" placeholder="请输入会议地点" />
                    </el-form-item>
                </template>

                <!-- 专利字段 -->
                <template v-if="formData.type === 'patent'">
                    <el-form-item label="专利号" prop="patentNumber">
                        <el-input v-model="formData.patentNumber" placeholder="请输入专利号" />
                    </el-form-item>
                    <el-form-item label="专利类型" prop="patentType">
                        <el-select v-model="formData.patentType" placeholder="请选择专利类型" style="width: 100%;">
                            <el-option label="发明专利" value="invention" />
                            <el-option label="实用新型" value="utility" />
                            <el-option label="外观设计" value="design" />
                        </el-select>
                    </el-form-item>
                </template>

                <!-- 公共字段 -->
                <el-form-item label="发表/授权时间" prop="publishDate">
                    <el-date-picker
                        v-model="formData.publishDate"
                        type="date"
                        placeholder="选择时间"
                        style="width: 100%;"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>

                <el-form-item label="DOI" prop="doi">
                    <el-input v-model="formData.doi" placeholder="请输入DOI（可选）" />
                </el-form-item>

                <el-form-item label="摘要" prop="abstract">
                    <el-input 
                        v-model="formData.abstract" 
                        type="textarea" 
                        :rows="4"
                        placeholder="请输入摘要（可选）"
                    />
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeDialog">取消</el-button>
                    <el-button type="primary" @click="saveAchievement">保存</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, Upload, UploadFilled, Search } from '@element-plus/icons-vue'
import { callSuccess, callWarning, callInfo, callError } from '@/call'
import { ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

export default {
    name: 'achievementManager',
    setup() {
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(3)
        
        // 成果类型标签
        const typeLabels = {
            journal: '期刊论文',
            conference: '会议论文',
            patent: '专利',
            book: '专著',
            software: '软件著作权'
        }

        // 学术成果数据
        const achievements = ref([
            {
                id: 1,
                type: 'journal',
                title: '基于深度学习的图像识别算法研究',
                authors: 'HHH, 张三, 李四',
                journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                volume: '45',
                issue: '3',
                pages: '123-135',
                publishDate: '2023-03-15',
                doi: '10.1109/TPAMI.2023.1234567'
            },
            {
                id: 2,
                type: 'conference',
                title: '自然语言处理中的注意力机制优化',
                authors: 'HHH, 王五',
                conference: 'AAAI Conference on Artificial Intelligence',
                location: 'Vancouver, Canada',
                publishDate: '2023-06-20',
                pages: '1001-1008'
            },
            {
                id: 3,
                type: 'patent',
                title: '一种基于机器学习的智能推荐系统',
                authors: 'HHH',
                patentNumber: 'CN123456789A',
                patentType: 'invention',
                publishDate: '2023-01-10'
            },
            {
                id: 4,
                type: 'journal',
                title: '计算机视觉中的目标检测算法综述',
                authors: 'HHH, 赵六, 钱七',
                journal: 'Computer Vision and Image Understanding',
                volume: '220',
                issue: '2',
                pages: '45-62',
                publishDate: '2023-08-12',
                doi: '10.1016/j.cviu.2023.103456'
            },
            {
                id: 5,
                type: 'conference',
                title: '基于Transformer的多模态学习方法',
                authors: 'HHH, 孙八',
                conference: 'International Conference on Computer Vision',
                location: 'Paris, France',
                publishDate: '2023-10-02',
                pages: '2234-2243'
            },
            {
                id: 6,
                type: 'book',
                title: '人工智能算法设计与实现',
                authors: 'HHH',
                publishDate: '2023-05-20',
                pages: '1-320'
            },
            {
                id: 7,
                type: 'software',
                title: '智能数据分析平台V1.0',
                authors: 'HHH, 开发团队',
                publishDate: '2023-07-15'
            },
            {
                id: 8,
                type: 'patent',
                title: '一种基于深度学习的语音识别方法',
                authors: 'HHH, 李九',
                patentNumber: 'CN987654321B',
                patentType: 'invention',
                publishDate: '2023-04-25'
            },
            {
                id: 9,
                type: 'journal',
                title: '强化学习在游戏AI中的应用研究',
                authors: 'HHH, 周十, 吴十一',
                journal: 'Artificial Intelligence',
                volume: '312',
                issue: '1',
                pages: '78-95',
                publishDate: '2023-11-08',
                doi: '10.1016/j.artint.2023.103789'
            },
            {
                id: 10,
                type: 'conference',
                title: '联邦学习中的隐私保护机制',
                authors: 'HHH, 郑十二',
                conference: 'Neural Information Processing Systems',
                location: 'New Orleans, USA',
                publishDate: '2023-12-10',
                pages: '5678-5689'
            },
            {
                id: 11,
                type: 'journal',
                title: '边缘计算环境下的智能调度算法',
                authors: 'HHH, 王十三, 刘十四',
                journal: 'IEEE Internet of Things Journal',
                volume: '10',
                issue: '15',
                pages: '13456-13470',
                publishDate: '2023-09-28',
                doi: '10.1109/JIOT.2023.3298765'
            }
        ])

        // 学术成果库数据（模拟全系统的学术成果）
        const libraryAchievements = ref([
            {
                id: 1001,
                type: 'journal',
                title: 'Deep Learning for Computer Vision: A Comprehensive Survey',
                authors: '张伟, 李明, 王强',
                journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                volume: '44',
                issue: '8',
                pages: '4123-4145',
                publishDate: '2022-08-15',
                doi: '10.1109/TPAMI.2022.3187456'
            },
            {
                id: 1002,
                type: 'conference',
                title: 'Attention Mechanisms in Natural Language Processing',
                authors: '陈红, 刘涛',
                conference: 'Annual Conference of the Association for Computational Linguistics',
                location: 'Dublin, Ireland',
                publishDate: '2022-05-22',
                pages: '2345-2356'
            },
            {
                id: 1003,
                type: 'journal',
                title: 'Federated Learning: Challenges, Methods, and Future Directions',
                authors: '杨磊, 赵敏, 孙华',
                journal: 'IEEE Communications Surveys & Tutorials',
                volume: '25',
                issue: '2',
                pages: '1567-1598',
                publishDate: '2023-02-10',
                doi: '10.1109/COMST.2023.3245678'
            },
            {
                id: 1004,
                type: 'patent',
                title: '基于区块链的数据安全存储方法',
                authors: '马超, 吴静',
                patentNumber: 'CN202310123456.7',
                patentType: 'invention',
                publishDate: '2023-03-20'
            },
            {
                id: 1005,
                type: 'conference',
                title: 'Graph Neural Networks for Social Network Analysis',
                authors: '周杰, 林芳',
                conference: 'International Conference on Machine Learning',
                location: 'Honolulu, Hawaii',
                publishDate: '2023-07-25',
                pages: '7890-7902'
            },
            {
                id: 1006,
                type: 'journal',
                title: 'Quantum Computing: Algorithms and Applications',
                authors: '胡斌, 郭丽, 何东',
                journal: 'Nature Reviews Physics',
                volume: '5',
                issue: '4',
                pages: '245-267',
                publishDate: '2023-04-12',
                doi: '10.1038/s42254-023-00567-8'
            },
            {
                id: 1007,
                type: 'book',
                title: '人工智能伦理学导论',
                authors: '田野',
                publishDate: '2023-06-15',
                pages: '1-456'
            },
            {
                id: 1008,
                type: 'software',
                title: 'AI数据分析平台V2.0',
                authors: '开发团队, 项目负责人：钱进',
                publishDate: '2023-09-10'
            },
            {
                id: 1009,
                type: 'journal',
                title: 'Edge Computing for IoT: A Survey',
                authors: '蒋涛, 沈丽娟',
                journal: 'IEEE Internet of Things Journal',
                volume: '10',
                issue: '12',
                pages: '10234-10256',
                publishDate: '2023-06-30',
                doi: '10.1109/JIOT.2023.3278901'
            },
            {
                id: 1010,
                type: 'conference',
                title: 'Reinforcement Learning in Autonomous Driving',
                authors: '韩梅, 宋阳',
                conference: 'IEEE International Conference on Robotics and Automation',
                location: 'London, UK',
                publishDate: '2023-05-29',
                pages: '4567-4578'
            },
            {
                id: 1011,
                type: 'patent',
                title: '智能推荐系统及其实现方法',
                authors: '冯雪, 邓伟',
                patentNumber: 'CN202310234567.8',
                patentType: 'invention',
                publishDate: '2023-08-15'
            },
            {
                id: 1012,
                type: 'journal',
                title: 'Blockchain Technology in Healthcare: Opportunities and Challenges',
                authors: '袁浩, 姚娜',
                journal: 'IEEE Transactions on Biomedical Engineering',
                volume: '70',
                issue: '9',
                pages: '2567-2578',
                publishDate: '2023-09-05',
                doi: '10.1109/TBME.2023.3289456'
            },
            {
                id: 1013,
                type: 'conference',
                title: 'Multimodal Learning for Human-Computer Interaction',
                authors: '曹军, 秦雨',
                conference: 'ACM International Conference on Multimodal Interaction',
                location: 'Paris, France',
                publishDate: '2023-10-09',
                pages: '123-134'
            },
            {
                id: 1014,
                type: 'journal',
                title: 'Privacy-Preserving Machine Learning: A Survey',
                authors: '梁勇, 范晓红',
                journal: 'ACM Computing Surveys',
                volume: '56',
                issue: '3',
                pages: '1-42',
                publishDate: '2023-11-20',
                doi: '10.1145/3578234.3578456'
            },
            {
                id: 1015,
                type: 'book',
                title: '深度学习实战指南',
                authors: '程亮, 许文静',
                publishDate: '2023-12-01',
                pages: '1-678'
            }
        ])

        // 对话框相关
        const dialogVisible = ref(false)
        const isEdit = ref(false)
        const formRef = ref()
        const editingId = ref(null)

        // Excel导入相关
        const excelDialogVisible = ref(false)
        const excelUploadRef = ref()
        const excelPreviewData = ref([])

        // 从库中选择相关
        const selectDialogVisible = ref(false)
        const selectedAchievements = ref([])
        const searchKeyword = ref('')
        const libraryCurrentPage = ref(1)
        const libraryPageSize = ref(5)
        
        // 表单数据
        const formData = ref({
            type: '',
            title: '',
            authors: '',
            journal: '',
            volume: '',
            issue: '',
            pages: '',
            conference: '',
            location: '',
            patentNumber: '',
            patentType: '',
            publishDate: '',
            doi: '',
            abstract: ''
        })

        // 动态验证规则
        const rules = computed(() => {
            const baseRules = {
                type: [{ required: true, message: '请选择成果类型', trigger: 'change' }],
                title: [{ required: true, message: '请输入成果标题', trigger: 'blur' }],
                authors: [{ required: true, message: '请输入作者信息', trigger: 'blur' }],
                publishDate: [{ required: true, message: '请选择发表/授权时间', trigger: 'change' }]
            }

            // 根据类型添加特定验证规则
            if (formData.value.type === 'journal') {
                baseRules.journal = [{ required: true, message: '请输入期刊名称', trigger: 'blur' }]
                baseRules.volume = [{ required: true, message: '请输入卷号', trigger: 'blur' }]
                baseRules.issue = [{ required: true, message: '请输入期号', trigger: 'blur' }]
            } else if (formData.value.type === 'conference') {
                baseRules.conference = [{ required: true, message: '请输入会议名称', trigger: 'blur' }]
            } else if (formData.value.type === 'patent') {
                baseRules.patentNumber = [{ required: true, message: '请输入专利号', trigger: 'blur' }]
                baseRules.patentType = [{ required: true, message: '请选择专利类型', trigger: 'change' }]
            }

            return baseRules
        })

        // 当前页成果数据
        const currentPageAchievements = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return achievements.value.slice(start, end)
        })

        // 过滤后的学术成果库数据
        const filteredLibraryAchievements = computed(() => {
            let filtered = libraryAchievements.value

            // 关键词搜索
            if (searchKeyword.value) {
                const keyword = searchKeyword.value.toLowerCase()
                filtered = filtered.filter(item => 
                    item.title.toLowerCase().includes(keyword) ||
                    item.authors.toLowerCase().includes(keyword) ||
                    (item.journal && item.journal.toLowerCase().includes(keyword)) ||
                    (item.conference && item.conference.toLowerCase().includes(keyword))
                )
            }

            return filtered
        })

        // 当前页库中成果数据
        const currentPageLibraryAchievements = computed(() => {
            const start = (libraryCurrentPage.value - 1) * libraryPageSize.value
            const end = start + libraryPageSize.value
            return filteredLibraryAchievements.value.slice(start, end)
        })

        // 类型改变时重置相关字段
        const onTypeChange = () => {
            const keepFields = ['type', 'title', 'authors', 'publishDate', 'doi', 'abstract']
            const newFormData = {}
            keepFields.forEach(field => {
                newFormData[field] = formData.value[field]
            })
            formData.value = { ...formData.value, ...newFormData }
        }

        // 打开添加对话框
        const openAddDialog = () => {
            isEdit.value = false
            formData.value = {
                type: '',
                title: '',
                authors: 'HHH',
                journal: '',
                volume: '',
                issue: '',
                pages: '',
                conference: '',
                location: '',
                patentNumber: '',
                patentType: '',
                publishDate: '',
                doi: '',
                abstract: ''
            }
            dialogVisible.value = true
        }

        // 编辑成果
        const editAchievement = (achievement) => {
            isEdit.value = true
            editingId.value = achievement.id
            formData.value = { ...achievement }
            dialogVisible.value = true
        }

        // 删除成果
        const deleteAchievement = async (id) => {
            try {
                await ElMessageBox.confirm('确定要删除这个学术成果吗？', '确认删除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = achievements.value.findIndex(a => a.id === id)
                if (index > -1) {
                    achievements.value.splice(index, 1)
                    callSuccess('删除成功')
                }
            } catch {
                callInfo('已取消删除')
            }
        }

        // 检查数据完整性
        const checkDataIntegrity = (data) => {
            const errors = []
            
            if (data.type === 'journal') {
                if (!data.journal) errors.push('期刊名称')
                if (!data.volume) errors.push('卷号')
                if (!data.issue) errors.push('期号')
            } else if (data.type === 'conference') {
                if (!data.conference) errors.push('会议名称')
            } else if (data.type === 'patent') {
                if (!data.patentNumber) errors.push('专利号')
                if (!data.patentType) errors.push('专利类型')
            }

            if (errors.length > 0) {
                callError(`以下字段不完整：${errors.join('、')}`)
                return false
            }
            return true
        }

        // 保存成果
        const saveAchievement = async () => {
            try {
                await formRef.value.validate()
                
                // 检查数据完整性
                if (!checkDataIntegrity(formData.value)) {
                    return
                }
                
                if (isEdit.value) {
                    // 编辑
                    const index = achievements.value.findIndex(a => a.id === editingId.value)
                    if (index > -1) {
                        achievements.value[index] = { ...formData.value, id: editingId.value }
                        callSuccess('更新成功')
                    }
                } else {
                    // 添加
                    const newAchievement = {
                        ...formData.value,
                        id: Date.now() // 简单的ID生成
                    }
                    achievements.value.unshift(newAchievement)
                    callSuccess('添加成功')
                }
                
                closeDialog()
            } catch {
                callWarning('请填写完整信息')
            }
        }

        // 关闭对话框
        const closeDialog = () => {
            dialogVisible.value = false
            formRef.value?.clearValidate()
        }

        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
        }

        // 字段映射表
        const fieldMapping = {
            '成果类型': 'type',
            '类型': 'type',
            '标题': 'title',
            '题目': 'title',
            '作者': 'authors',
            '期刊名称': 'journal',
            '期刊': 'journal',
            '会议名称': 'conference',
            '会议': 'conference',
            '专利号': 'patentNumber',
            '专利类型': 'patentType',
            '卷号': 'volume',
            '卷': 'volume',
            '期号': 'issue',
            '期': 'issue',
            '页码': 'pages',
            '页': 'pages',
            '会议地点': 'location',
            '地点': 'location',
            '发表时间': 'publishDate',
            '发表日期': 'publishDate',
            '授权时间': 'publishDate',
            '时间': 'publishDate',
            '日期': 'publishDate',
            'DOI': 'doi',
            'doi': 'doi',
            '摘要': 'abstract',
            '简介': 'abstract'
        }

        // 成果类型映射
        const typeMapping = {
            '期刊论文': 'journal',
            '期刊': 'journal',
            '会议论文': 'conference',
            '会议': 'conference',
            '专利': 'patent',
            '专著': 'book',
            '书籍': 'book',
            '软件著作权': 'software',
            '软件': 'software'
        }

        // 打开Excel上传对话框
        const openExcelUploadDialog = () => {
            excelDialogVisible.value = true
            excelPreviewData.value = []
        }

        // 关闭Excel上传对话框
        const closeExcelDialog = () => {
            excelDialogVisible.value = false
            excelPreviewData.value = []
            excelUploadRef.value?.clearFiles()
        }

        // Excel文件上传前检查
        const beforeExcelUpload = (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                           file.type === 'application/vnd.ms-excel'
            const isLt10M = file.size / 1024 / 1024 < 10

            if (!isExcel) {
                callError('只能上传Excel文件！')
                return false
            }
            if (!isLt10M) {
                callError('文件大小不能超过10MB！')
                return false
            }
            return true
        }

        // 处理Excel文件变化
        const handleExcelChange = (file) => {
            if (!file.raw) return
            
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array' })
                    
                    // 读取第一个工作表
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    
                    // 转换为JSON格式
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
                    
                    // 处理数据，假设第一列是字段名，第二列是值
                    const processedData = []
                    jsonData.forEach((row, index) => {
                        if (row.length >= 2 && row[0] && row[1]) {
                            processedData.push({
                                field: row[0].toString().trim(),
                                value: row[1].toString().trim()
                            })
                        }
                    })
                    
                    if (processedData.length === 0) {
                        callWarning('Excel文件中没有找到有效数据，请检查格式')
                        return
                    }
                    
                    excelPreviewData.value = processedData
                    callSuccess(`成功解析${processedData.length}条数据`)
                    
                } catch (error) {
                    console.error('Excel解析错误:', error)
                    callError('Excel文件解析失败，请检查文件格式')
                }
            }
            reader.readAsArrayBuffer(file.raw)
        }

        // 导入Excel数据到表单
        const importExcelData = () => {
            if (excelPreviewData.value.length === 0) {
                callWarning('没有可导入的数据')
                return
            }

            // 重置表单数据
            const newFormData = {
                type: '',
                title: '',
                authors: 'HHH',
                journal: '',
                volume: '',
                issue: '',
                pages: '',
                conference: '',
                location: '',
                patentNumber: '',
                patentType: '',
                publishDate: '',
                doi: '',
                abstract: ''
            }

            // 根据Excel数据填充表单
            excelPreviewData.value.forEach(item => {
                const fieldKey = fieldMapping[item.field]
                if (fieldKey) {
                    if (fieldKey === 'type') {
                        // 处理成果类型映射
                        const mappedType = typeMapping[item.value]
                        if (mappedType) {
                            newFormData[fieldKey] = mappedType
                        } else {
                            newFormData[fieldKey] = item.value
                        }
                    } else if (fieldKey === 'publishDate') {
                        // 处理日期格式
                        try {
                            const date = new Date(item.value)
                            if (!isNaN(date.getTime())) {
                                newFormData[fieldKey] = date.toISOString().split('T')[0]
                            } else {
                                newFormData[fieldKey] = item.value
                            }
                        } catch {
                            newFormData[fieldKey] = item.value
                        }
                    } else {
                        newFormData[fieldKey] = item.value
                    }
                }
            })

            // 更新表单数据
            formData.value = newFormData
            
            // 关闭Excel对话框，打开添加表单对话框
            closeExcelDialog()
            isEdit.value = false
            dialogVisible.value = true
            
                        callSuccess('数据已导入到表单，请检查并完善信息')
        }

        // 打开从库中选择对话框
        const openSelectDialog = () => {
            selectDialogVisible.value = true
            selectedAchievements.value = []
            searchKeyword.value = ''
            libraryCurrentPage.value = 1
        }

        // 关闭从库中选择对话框
        const closeSelectDialog = () => {
            selectDialogVisible.value = false
            selectedAchievements.value = []
            searchKeyword.value = ''
        }

        // 搜索处理
        const handleSearch = () => {
            libraryCurrentPage.value = 1
        }

        // 切换选择状态
        const toggleSelection = (id) => {
            const index = selectedAchievements.value.indexOf(id)
            if (index > -1) {
                selectedAchievements.value.splice(index, 1)
            } else {
                selectedAchievements.value.push(id)
            }
        }

        // 库分页处理
        const handleLibraryPageChange = (page) => {
            libraryCurrentPage.value = page
        }

        // 添加选中的学术成果
        const addSelectedAchievements = () => {
            if (selectedAchievements.value.length === 0) {
                callWarning('请选择要添加的学术成果')
                return
            }

            let addedCount = 0
            selectedAchievements.value.forEach(id => {
                const libraryItem = libraryAchievements.value.find(item => item.id === id)
                if (libraryItem) {
                    // 检查是否已存在（基于标题和作者）
                    const exists = achievements.value.some(item => 
                        item.title === libraryItem.title && item.authors === libraryItem.authors
                    )
                    
                    if (!exists) {
                        // 生成新的ID并添加到个人成果列表
                        const newAchievement = {
                            ...libraryItem,
                            id: Date.now() + Math.random() // 生成新的唯一ID
                        }
                        achievements.value.unshift(newAchievement)
                        addedCount++
                    }
                }
            })

            if (addedCount > 0) {
                callSuccess(`成功添加 ${addedCount} 项学术成果`)
            } else {
                callInfo('所选成果已存在，未添加重复项')
            }
            
            closeSelectDialog()
        }

        return {
            currentPage,
            pageSize,
            typeLabels,
            achievements,
            currentPageAchievements,
            dialogVisible,
            isEdit,
            formRef,
            formData,
            rules,
            excelDialogVisible,
            excelUploadRef,
            excelPreviewData,
            selectDialogVisible,
            selectedAchievements,
            searchKeyword,
            libraryCurrentPage,
            libraryPageSize,
            filteredLibraryAchievements,
            currentPageLibraryAchievements,
            onTypeChange,
            openAddDialog,
            editAchievement,
            deleteAchievement,
            saveAchievement,
            closeDialog,
            handlePageChange,
            openExcelUploadDialog,
            closeExcelDialog,
            beforeExcelUpload,
            handleExcelChange,
            importExcelData,
            openSelectDialog,
            closeSelectDialog,
            handleSearch,
            toggleSelection,
            handleLibraryPageChange,
            addSelectedAchievements
        }
    }
}
</script>

<style scoped>
.achievement-manager {
    width: 100%;
}

.manager-card {
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

.header-actions {
    display: flex;
    gap: 10px;
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

.achievement-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.achievement-item {
    padding: 15px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.achievement-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.achievement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.title-type-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.achievement-type-tag {
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 11px;
    font-weight: 500;
    color: white;
}

.achievement-type-tag.journal {
    background-color: #409eff;
}

.achievement-type-tag.conference {
    background-color: #67c23a;
}

.achievement-type-tag.patent {
    background-color: #e6a23c;
}

.achievement-type-tag.book {
    background-color: #9c27b0;
}

.achievement-type-tag.software {
    background-color: #f56c6c;
}

.achievement-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.achievement-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0;
    line-height: 1.3;
    text-align: left;
    flex: 1;
}

.achievement-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.meta-row {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
}

.meta-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
    font-weight: 600;
}

.meta-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    margin-right: 15px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* Excel上传样式 */
.excel-upload-section {
    padding: 20px 0;
}

.upload-tips {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #409eff;
    text-align: left;
}

.upload-tips h4 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.upload-tips ul {
    margin: 0;
    padding-left: 20px;
    color: #666;
}

.upload-tips li {
    margin-bottom: 5px;
    font-size: 14px;
    line-height: 1.5;
}

.excel-upload {
    margin-bottom: 20px;
}

.preview-section {
    margin-top: 20px;
}

.preview-section h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

/* 从库中选择样式 */
.select-achievement-section {
    padding: 20px 0;
}

.search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e9ecef;
}

.search-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
}

.search-controls {
    display: flex;
    align-items: center;
}

.achievement-library {
    min-height: 400px;
    max-height: 500px;
    overflow-y: auto;
}

.empty-library {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
}

.library-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.library-item {
    padding: 15px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
}

.library-item:hover {
    border-color: #409eff;
    background-color: #f0f8ff;
}

.library-item.selected {
    border-color: #409eff;
    background-color: #e3f2fd;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.library-item-content {
    width: 100%;
}

.library-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.library-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1.3;
    text-align: left;
    flex: 1;
}

.library-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.library-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selected-count {
    color: #666;
    font-size: 14px;
}

.footer-actions {
    display: flex;
    gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .achievement-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .title-type-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
    }
    
    .achievement-title {
        font-size: 14px;
    }
    
    .achievement-actions {
        width: 100%;
        justify-content: flex-end;
    }
    
    .header-actions {
        flex-direction: column;
        width: 100%;
        gap: 8px;
    }
    
    .upload-tips {
        padding: 10px;
    }
    
    .upload-tips h4 {
        font-size: 14px;
    }
    
    .upload-tips li {
        font-size: 12px;
    }
    
    .search-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }
    
    .search-controls {
        width: 100%;
        flex-direction: column;
        gap: 10px;
    }
    
    .search-controls .el-input {
        width: 100% !important;
    }
    
    .library-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .dialog-footer {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }
    
    .footer-actions {
        justify-content: center;
    }
}
</style> 