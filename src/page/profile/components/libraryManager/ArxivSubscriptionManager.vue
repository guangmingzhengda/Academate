<template>
  <div class="arxiv-subscription-manager">
    <!-- 管理arXiv订阅按钮 -->
    <el-button 
      type="primary" 
      @click="openSubscriptionDialog"
      class="subscription-manager-btn"
    >
      <el-icon><Setting /></el-icon>
      管理arXiv订阅
    </el-button>

    <!-- arXiv订阅管理对话框 -->
    <el-dialog
      v-model="subscriptionDialogVisible"
      title="管理arXiv订阅"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="subscription-dialog-content">
        <!-- 添加新订阅区域 -->
        <div class="add-subscription-section">
          <h4>添加新订阅</h4>
          <el-form :model="newSubscriptionForm" :rules="subscriptionRules" ref="subscriptionFormRef" label-width="100px">
            <el-form-item label="订阅类型" prop="subscriptionType">
              <el-radio-group v-model="newSubscriptionForm.subscriptionType">
                <el-radio label="keyword">关键词</el-radio>
                <el-radio label="author">科研人员</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <!-- 关键词订阅 -->
            <el-form-item 
              v-if="newSubscriptionForm.subscriptionType === 'keyword'" 
              label="关键词" 
              prop="keyword"
            >
              <el-tree-select
                v-model="newSubscriptionForm.keyword"
                :data="keywordTreeData"
                placeholder="请选择arXiv关键词"
                style="width: 100%"
                :props="{
                  value: 'keyword',
                  label: 'name',
                  children: 'children'
                }"
                check-strictly
                default-expand-all
                clearable
                filterable
                :render-after-expand="false"
                @change="handleKeywordChange"
              />
            </el-form-item>
            
            <!-- 作者订阅 -->
            <el-form-item 
              v-if="newSubscriptionForm.subscriptionType === 'author'" 
              label="科研人员" 
              prop="author"
            >
              <el-input
                v-model="newSubscriptionForm.author"
                placeholder="请输入科研人员姓名"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="收藏夹" prop="favoriteId">
              <el-tree-select
                v-model="newSubscriptionForm.favoriteId"
                :data="folderTreeData"
                placeholder="请选择收藏夹"
                style="width: 100%"
                :props="{
                  value: 'favoriteId',
                  label: 'name',
                  children: 'children'
                }"
                check-strictly
                default-expand-all
                clearable
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="addSubscription"
                :loading="addingSubscription"
                :disabled="!canAddSubscription"
              >
                添加订阅
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 当前订阅列表区域 -->
        <div class="current-subscriptions-section">
          <h4>当前订阅</h4>
          
          <!-- 关键词订阅列表 -->
          <div v-if="keywordSubscriptions.length > 0" class="subscription-list">
            <h5>关键词订阅</h5>
            <div class="subscription-items">
              <div 
                v-for="subscription in keywordSubscriptions" 
                :key="subscription.keyword"
                class="subscription-item"
              >
                <div class="subscription-info">
                  <div class="subscription-keyword">
                    <span class="keyword-code">{{ subscription.keyword }}</span>
                    <span class="keyword-name">{{ getKeywordDisplayName(subscription.keyword) }}</span>
                  </div>
                </div>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeKeywordSubscription(subscription.keyword)"
                  :loading="removingKeyword === subscription.keyword"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 作者订阅列表 -->
          <div v-if="authorSubscriptions.length > 0" class="subscription-list">
            <h5>科研人员订阅</h5>
            <div class="subscription-items">
              <div 
                v-for="subscription in authorSubscriptions" 
                :key="subscription.author"
                class="subscription-item"
              >
                <div class="subscription-info">
                  <div class="subscription-author">
                    <span class="author-icon">👤</span>
                    <span class="author-name">{{ subscription.author }}</span>
                  </div>
                </div>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeAuthorSubscription(subscription.author)"
                  :loading="removingAuthor === subscription.author"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 无订阅提示 -->
          <div v-if="keywordSubscriptions.length === 0 && authorSubscriptions.length === 0" class="no-subscriptions">
            <el-empty description="暂无订阅" :image-size="60"></el-empty>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Setting } from '@element-plus/icons-vue';
import { 
  subscribeArxivKeyword, 
  subscribeArxivAuthor,
  getArxivSubscriptionList,
  getArxivAuthorSubscriptionList,
  unsubscribeArxivKeyword,
  unsubscribeArxivAuthor,
  ArxivSubscriptionVO,
  ArxivAuthorSubscriptionVO
} from '@/api/arxiv';
import { getFavoritePage, Favorite } from '@/api/favorite';
import { ElMessage } from 'element-plus';

// 树形节点类型
interface TreeNode {
  id: number;
  label: string;
  children?: TreeNode[];
  favoriteId: number;
  name: string;
  userId: number;
  parentId: number;
}

// 关键词节点类型
interface KeywordNode {
  id: string;
  name: string;
  keyword?: string;
  children?: KeywordNode[];
}

export default defineComponent({
  name: 'ArxivSubscriptionManager',
  
  setup() {
    // 对话框状态
    const subscriptionDialogVisible = ref(false);
    
    // 表单相关
    const subscriptionFormRef = ref();
    const newSubscriptionForm = ref({
      subscriptionType: 'keyword',
      keyword: '',
      author: '',
      favoriteId: null as number | null
    });
    
    // 表单验证规则
    const subscriptionRules = {
      subscriptionType: [
        { required: true, message: '请选择订阅类型', trigger: 'change' }
      ],
      keyword: [
        { required: true, message: '请选择arXiv关键词', trigger: 'blur' }
      ],
      author: [
        { required: true, message: '请输入科研人员姓名', trigger: 'blur' }
      ],
      favoriteId: [
        { required: true, message: '请选择收藏夹', trigger: 'change' }
      ]
    };
    
    // 树形收藏夹数据
    const folderTreeData = ref<TreeNode[]>([]);
    
    // 关键词树形数据
    const keywordTreeData = ref<KeywordNode[]>([]);
    
    // 订阅列表
    const keywordSubscriptions = ref<ArxivSubscriptionVO[]>([]);
    const authorSubscriptions = ref<ArxivAuthorSubscriptionVO[]>([]);
    
    // 加载状态
    const addingSubscription = ref(false);
    const removingKeyword = ref<string | null>(null);
    const removingAuthor = ref<string | null>(null);
    
    // 计算属性
    const canAddSubscription = computed(() => {
      if (newSubscriptionForm.value.subscriptionType === 'keyword') {
        return newSubscriptionForm.value.keyword && newSubscriptionForm.value.favoriteId;
      } else {
        return newSubscriptionForm.value.author && newSubscriptionForm.value.favoriteId;
      }
    });
    
    // 打开订阅管理对话框
    const openSubscriptionDialog = () => {
      subscriptionDialogVisible.value = true;
      loadSubscriptions();
      loadFolderTree();
      loadKeywordTree();
    };
    
    // 构建树形收藏夹数据
    const loadFolderTree = async () => {
      try {
        const allFolders = await getAllFolders();
        const treeData = buildFolderTree(allFolders);
        folderTreeData.value = treeData;
      } catch (error) {
        console.error('加载收藏夹树失败:', error);
      }
    };
    
    // 获取所有收藏夹
    const getAllFolders = async (): Promise<Favorite[]> => {
      const allFolders: Favorite[] = [];
      await loadFoldersRecursively(0, allFolders);
      return allFolders;
    };
    
    // 递归加载收藏夹
    const loadFoldersRecursively = async (parentId: number, allFolders: Favorite[]) => {
      try {
        const result = await getFavoritePage({
          pageSize: 100,
          pageNum: 1,
          parentId: parentId
        });
        
        if (result && result.list.length > 0) {
          allFolders.push(...result.list);
          
          // 递归加载子收藏夹
          for (const folder of result.list) {
            await loadFoldersRecursively(folder.favoriteId, allFolders);
          }
        }
      } catch (error) {
        console.error(`加载父级ID ${parentId} 的收藏夹失败:`, error);
      }
    };
    
    // 构建树形结构
    const buildFolderTree = (folders: Favorite[]): TreeNode[] => {
      const folderMap = new Map<number, TreeNode>();
      const rootNodes: TreeNode[] = [];
      
      // 创建所有节点
      folders.forEach(folder => {
        const node: TreeNode = {
          id: folder.favoriteId,
          label: folder.name,
          favoriteId: folder.favoriteId,
          name: folder.name,
          userId: folder.userId,
          parentId: folder.parentId,
          children: []
        };
        folderMap.set(folder.favoriteId, node);
      });
      
      // 构建父子关系
      folders.forEach(folder => {
        const node = folderMap.get(folder.favoriteId);
        if (node) {
          if (folder.parentId === 0) {
            // 根节点
            rootNodes.push(node);
          } else {
            // 子节点
            const parentNode = folderMap.get(folder.parentId);
            if (parentNode) {
              if (!parentNode.children) {
                parentNode.children = [];
              }
              parentNode.children.push(node);
            }
          }
        }
      });
      
      return rootNodes;
    };
    
    // 加载订阅列表
    const loadSubscriptions = async () => {
      try {
        // 加载关键词订阅
        const keywords = await getArxivSubscriptionList();
        if (keywords) {
          keywordSubscriptions.value = keywords;
        }
        
        // 加载作者订阅
        const authors = await getArxivAuthorSubscriptionList();
        if (authors) {
          authorSubscriptions.value = authors;
        }
      } catch (error) {
        console.error('加载订阅列表失败:', error);
      }
    };
    
    // 添加订阅
    const addSubscription = async () => {
      if (!subscriptionFormRef.value) return;
      
      try {
        await subscriptionFormRef.value.validate();
      } catch (error) {
        return;
      }
      
      addingSubscription.value = true;
      
      try {
        let success = false;
        
        if (newSubscriptionForm.value.subscriptionType === 'keyword') {
          success = await subscribeArxivKeyword({
            keyword: newSubscriptionForm.value.keyword,
            favoriteId: newSubscriptionForm.value.favoriteId!
          });
        } else {
          success = await subscribeArxivAuthor({
            author: newSubscriptionForm.value.author,
            favoriteId: newSubscriptionForm.value.favoriteId!
          });
        }
        
        if (success) {
          // 重置表单
          newSubscriptionForm.value = {
            subscriptionType: 'keyword',
            keyword: '',
            author: '',
            favoriteId: null
          };
          // 重新加载订阅列表
          await loadSubscriptions();
        }
      } catch (error) {
        console.error('添加订阅失败:', error);
      } finally {
        addingSubscription.value = false;
      }
    };
    
    // 删除关键词订阅
    const removeKeywordSubscription = async (keyword: string) => {
      removingKeyword.value = keyword;
      
      try {
        const success = await unsubscribeArxivKeyword(keyword);
        if (success) {
          await loadSubscriptions();
        }
      } catch (error) {
        console.error('删除关键词订阅失败:', error);
      } finally {
        removingKeyword.value = null;
      }
    };
    
    // 删除作者订阅
    const removeAuthorSubscription = async (author: string) => {
      removingAuthor.value = author;
      
      try {
        const success = await unsubscribeArxivAuthor(author);
        if (success) {
          await loadSubscriptions();
        }
      } catch (error) {
        console.error('删除作者订阅失败:', error);
      } finally {
        removingAuthor.value = null;
      }
    };
    
    // 监听订阅类型变化，重置相关字段
    watch(() => newSubscriptionForm.value.subscriptionType, (newType) => {
      if (newType === 'keyword') {
        newSubscriptionForm.value.author = '';
      } else {
        newSubscriptionForm.value.keyword = '';
      }
    });
    
    // 加载关键词树形数据
    const loadKeywordTree = () => {
      keywordTreeData.value = [
        {
          id: 'cs',
          name: '计算机科学 (Computer Science)',
          keyword: 'cs',
          children: [
            { id: 'cs.AI', name: '人工智能 (cs.AI)', keyword: 'cs.AI' },
            { id: 'cs.CL', name: '计算与语言 (cs.CL)', keyword: 'cs.CL' },
            { id: 'cs.CV', name: '计算机视觉与模式识别 (cs.CV)', keyword: 'cs.CV' },
            { id: 'cs.LG', name: '机器学习 (cs.LG)', keyword: 'cs.LG' },
            { id: 'cs.NE', name: '神经与进化计算 (cs.NE)', keyword: 'cs.NE' },
            { id: 'cs.RO', name: '机器人学 (cs.RO)', keyword: 'cs.RO' },
            { id: 'cs.CR', name: '密码学与安全 (cs.CR)', keyword: 'cs.CR' },
            { id: 'cs.DB', name: '数据库 (cs.DB)', keyword: 'cs.DB' },
            { id: 'cs.DS', name: '数据结构与算法 (cs.DS)', keyword: 'cs.DS' },
            { id: 'cs.HC', name: '人机交互 (cs.HC)', keyword: 'cs.HC' },
            { id: 'cs.IR', name: '信息检索 (cs.IR)', keyword: 'cs.IR' },
            { id: 'cs.IT', name: '信息论 (cs.IT)', keyword: 'cs.IT' },
            { id: 'cs.LO', name: '逻辑 (cs.LO)', keyword: 'cs.LO' },
            { id: 'cs.MM', name: '多媒体 (cs.MM)', keyword: 'cs.MM' },
            { id: 'cs.NI', name: '网络与互联网架构 (cs.NI)', keyword: 'cs.NI' },
            { id: 'cs.OS', name: '操作系统 (cs.OS)', keyword: 'cs.OS' },
            { id: 'cs.PL', name: '编程语言 (cs.PL)', keyword: 'cs.PL' },
            { id: 'cs.SE', name: '软件工程 (cs.SE)', keyword: 'cs.SE' },
            { id: 'cs.SY', name: '系统与控制 (cs.SY)', keyword: 'cs.SY' }
          ]
        },
        {
          id: 'math',
          name: '数学 (Mathematics)',
          keyword: 'math',
          children: [
            { id: 'math.AG', name: '代数几何 (math.AG)', keyword: 'math.AG' },
            { id: 'math.AT', name: '代数拓扑 (math.AT)', keyword: 'math.AT' },
            { id: 'math.AP', name: '分析 (math.AP)', keyword: 'math.AP' },
            { id: 'math.CO', name: '组合数学 (math.CO)', keyword: 'math.CO' },
            { id: 'math.CT', name: '范畴论 (math.CT)', keyword: 'math.CT' },
            { id: 'math.DG', name: '微分几何 (math.DG)', keyword: 'math.DG' },
            { id: 'math.DS', name: '动力系统 (math.DS)', keyword: 'math.DS' },
            { id: 'math.FA', name: '泛函分析 (math.FA)', keyword: 'math.FA' },
            { id: 'math.GM', name: '一般数学 (math.GM)', keyword: 'math.GM' },
            { id: 'math.GN', name: '一般拓扑 (math.GN)', keyword: 'math.GN' },
            { id: 'math.GT', name: '几何拓扑 (math.GT)', keyword: 'math.GT' },
            { id: 'math.HO', name: '代数拓扑 (math.HO)', keyword: 'math.HO' },
            { id: 'math.IT', name: '信息论 (math.IT)', keyword: 'math.IT' },
            { id: 'math.KT', name: 'K理论与同调 (math.KT)', keyword: 'math.KT' },
            { id: 'math.LO', name: '逻辑 (math.LO)', keyword: 'math.LO' },
            { id: 'math.MG', name: '度量几何 (math.MG)', keyword: 'math.MG' },
            { id: 'math.MP', name: '数学物理 (math.MP)', keyword: 'math.MP' },
            { id: 'math.NA', name: '数值分析 (math.NA)', keyword: 'math.NA' },
            { id: 'math.NT', name: '数论 (math.NT)', keyword: 'math.NT' },
            { id: 'math.OA', name: '算子代数 (math.OA)', keyword: 'math.OA' },
            { id: 'math.OC', name: '优化与控制 (math.OC)', keyword: 'math.OC' },
            { id: 'math.PR', name: '概率论 (math.PR)', keyword: 'math.PR' },
            { id: 'math.QA', name: '量子代数 (math.QA)', keyword: 'math.QA' },
            { id: 'math.RA', name: '环与代数 (math.RA)', keyword: 'math.RA' },
            { id: 'math.RT', name: '表示论 (math.RT)', keyword: 'math.RT' },
            { id: 'math.SG', name: '辛几何 (math.SG)', keyword: 'math.SG' },
            { id: 'math.SP', name: '谱理论 (math.SP)', keyword: 'math.SP' },
            { id: 'math.ST', name: '统计理论 (math.ST)', keyword: 'math.ST' }
          ]
        },
        {
          id: 'physics',
          name: '物理学 (Physics)',
          keyword: 'physics',
          children: [
            { id: 'astro-ph', name: '天体物理 (astro-ph)', keyword: 'astro-ph' },
            { id: 'cond-mat', name: '凝聚态物理 (cond-mat)', keyword: 'cond-mat' },
            { id: 'gr-qc', name: '广义相对论与量子宇宙学 (gr-qc)', keyword: 'gr-qc' },
            { id: 'hep-ex', name: '高能物理实验 (hep-ex)', keyword: 'hep-ex' },
            { id: 'hep-lat', name: '高能物理格点 (hep-lat)', keyword: 'hep-lat' },
            { id: 'hep-ph', name: '高能物理现象学 (hep-ph)', keyword: 'hep-ph' },
            { id: 'hep-th', name: '高能物理理论 (hep-th)', keyword: 'hep-th' },
            { id: 'math-ph', name: '数学物理 (math-ph)', keyword: 'math-ph' },
            { id: 'nlin', name: '非线性科学 (nlin)', keyword: 'nlin' },
            { id: 'nucl-ex', name: '核实验 (nucl-ex)', keyword: 'nucl-ex' },
            { id: 'nucl-th', name: '核理论 (nucl-th)', keyword: 'nucl-th' },
            { id: 'physics', name: '物理 (physics)', keyword: 'physics' },
            { id: 'quant-ph', name: '量子物理 (quant-ph)', keyword: 'quant-ph' }
          ]
        },
        {
          id: 'q-bio',
          name: '生物学 (Quantitative Biology)',
          keyword: 'q-bio',
          children: [
            { id: 'q-bio.BM', name: '生物分子 (q-bio.BM)', keyword: 'q-bio.BM' },
            { id: 'q-bio.CB', name: '细胞行为 (q-bio.CB)', keyword: 'q-bio.CB' },
            { id: 'q-bio.GN', name: '基因组学 (q-bio.GN)', keyword: 'q-bio.GN' },
            { id: 'q-bio.MN', name: '分子网络 (q-bio.MN)', keyword: 'q-bio.MN' },
            { id: 'q-bio.NC', name: '神经元与认知 (q-bio.NC)', keyword: 'q-bio.NC' },
            { id: 'q-bio.OT', name: '其他定量生物学 (q-bio.OT)', keyword: 'q-bio.OT' },
            { id: 'q-bio.PE', name: '群体与进化 (q-bio.PE)', keyword: 'q-bio.PE' },
            { id: 'q-bio.QM', name: '定量方法 (q-bio.QM)', keyword: 'q-bio.QM' },
            { id: 'q-bio.SC', name: '亚细胞过程 (q-bio.SC)', keyword: 'q-bio.SC' },
            { id: 'q-bio.TO', name: '组织与器官 (q-bio.TO)', keyword: 'q-bio.TO' }
          ]
        },
        {
          id: 'stat',
          name: '统计学 (Statistics)',
          keyword: 'stat',
          children: [
            { id: 'stat.AP', name: '应用统计 (stat.AP)', keyword: 'stat.AP' },
            { id: 'stat.CO', name: '计算统计 (stat.CO)', keyword: 'stat.CO' },
            { id: 'stat.ME', name: '方法论 (stat.ME)', keyword: 'stat.ME' },
            { id: 'stat.ML', name: '机器学习 (stat.ML)', keyword: 'stat.ML' },
            { id: 'stat.OT', name: '其他统计 (stat.OT)', keyword: 'stat.OT' },
            { id: 'stat.TH', name: '统计理论 (stat.TH)', keyword: 'stat.TH' }
          ]
        },
        {
          id: 'econ',
          name: '经济学 (Economics)',
          keyword: 'econ',
          children: [
            { id: 'econ.EM', name: '计量经济学 (econ.EM)', keyword: 'econ.EM' },
            { id: 'econ.GN', name: '一般经济学 (econ.GN)', keyword: 'econ.GN' },
            { id: 'econ.TH', name: '理论经济学 (econ.TH)', keyword: 'econ.TH' }
          ]
        },
        {
          id: 'eess',
          name: '电气工程 (Electrical Engineering)',
          keyword: 'eess',
          children: [
            { id: 'eess.AS', name: '音频与语音处理 (eess.AS)', keyword: 'eess.AS' },
            { id: 'eess.IV', name: '图像与视频处理 (eess.IV)', keyword: 'eess.IV' },
            { id: 'eess.SP', name: '信号处理 (eess.SP)', keyword: 'eess.SP' },
            { id: 'eess.SY', name: '系统与控制 (eess.SY)', keyword: 'eess.SY' }
          ]
        }
      ];
    };
    
    // 处理关键词变化
    const handleKeywordChange = (value: string) => {
      // 检查选择的是否为父级分类节点
      const parentKeywords = ['cs', 'math', 'physics', 'q-bio', 'stat', 'econ', 'eess'];
      if (parentKeywords.includes(value)) {
        // 如果选择的是父级分类，清空选择
        newSubscriptionForm.value.keyword = '';
        ElMessage.warning('请选择具体的子分类，而不是主分类');
      }
    };
    
    // 获取关键词的显示名称
    const getKeywordDisplayName = (keyword: string): string => {
      // 关键词映射表
      const keywordMap: { [key: string]: string } = {
        'cs.AI': '人工智能',
        'cs.CL': '计算与语言',
        'cs.CV': '计算机视觉与模式识别',
        'cs.LG': '机器学习',
        'cs.NE': '神经与进化计算',
        'cs.RO': '机器人学',
        'cs.CR': '密码学与安全',
        'cs.DB': '数据库',
        'cs.DS': '数据结构与算法',
        'cs.HC': '人机交互',
        'cs.IR': '信息检索',
        'cs.IT': '信息论',
        'cs.LO': '逻辑',
        'cs.MM': '多媒体',
        'cs.NI': '网络与互联网架构',
        'cs.OS': '操作系统',
        'cs.PL': '编程语言',
        'cs.SE': '软件工程',
        'cs.SY': '系统与控制',
        'math.AG': '代数几何',
        'math.AT': '代数拓扑',
        'math.AP': '分析',
        'math.CO': '组合数学',
        'math.CT': '范畴论',
        'math.DG': '微分几何',
        'math.DS': '动力系统',
        'math.FA': '泛函分析',
        'math.GM': '一般数学',
        'math.GN': '一般拓扑',
        'math.GT': '几何拓扑',
        'math.HO': '代数拓扑',
        'math.IT': '信息论',
        'math.KT': 'K理论与同调',
        'math.LO': '逻辑',
        'math.MG': '度量几何',
        'math.MP': '数学物理',
        'math.NA': '数值分析',
        'math.NT': '数论',
        'math.OA': '算子代数',
        'math.OC': '优化与控制',
        'math.PR': '概率论',
        'math.QA': '量子代数',
        'math.RA': '环与代数',
        'math.RT': '表示论',
        'math.SG': '辛几何',
        'math.SP': '谱理论',
        'math.ST': '统计理论',
        'astro-ph': '天体物理',
        'cond-mat': '凝聚态物理',
        'gr-qc': '广义相对论与量子宇宙学',
        'hep-ex': '高能物理实验',
        'hep-lat': '高能物理格点',
        'hep-ph': '高能物理现象学',
        'hep-th': '高能物理理论',
        'math-ph': '数学物理',
        'nlin': '非线性科学',
        'nucl-ex': '核实验',
        'nucl-th': '核理论',
        'physics': '物理',
        'quant-ph': '量子物理',
        'q-bio.BM': '生物分子',
        'q-bio.CB': '细胞行为',
        'q-bio.GN': '基因组学',
        'q-bio.MN': '分子网络',
        'q-bio.NC': '神经元与认知',
        'q-bio.OT': '其他定量生物学',
        'q-bio.PE': '群体与进化',
        'q-bio.QM': '定量方法',
        'q-bio.SC': '亚细胞过程',
        'q-bio.TO': '组织与器官',
        'stat.AP': '应用统计',
        'stat.CO': '计算统计',
        'stat.ME': '方法论',
        'stat.ML': '机器学习',
        'stat.OT': '其他统计',
        'stat.TH': '统计理论',
        'econ.EM': '计量经济学',
        'econ.GN': '一般经济学',
        'econ.TH': '理论经济学',
        'eess.AS': '音频与语音处理',
        'eess.IV': '图像与视频处理',
        'eess.SP': '信号处理',
        'eess.SY': '系统与控制'
      };
      
      return keywordMap[keyword] || keyword;
    };
    
    return {
      // 状态
      subscriptionDialogVisible,
      subscriptionFormRef,
      newSubscriptionForm,
      subscriptionRules,
      folderTreeData,
      keywordTreeData,
      keywordSubscriptions,
      authorSubscriptions,
      addingSubscription,
      removingKeyword,
      removingAuthor,
      
      // 计算属性
      canAddSubscription,
      
      // 方法
      openSubscriptionDialog,
      addSubscription,
      removeKeywordSubscription,
      removeAuthorSubscription,
      handleKeywordChange,
      getKeywordDisplayName
    };
  }
});
</script>

<style scoped>
.arxiv-subscription-manager {
  display: inline-block;
}

.subscription-manager-btn {
  margin-left: 0;
  font-family: 'Meiryo', sans-serif;
}

.el-dialog__body,
.subscription-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 5px;
}

.subscription-dialog-content {
  padding: 20px 0;
}

.add-subscription-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.add-subscription-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.current-subscriptions-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.subscription-list {
  margin-bottom: 16px;
}

.subscription-list h5 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.subscription-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.subscription-item {
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 20px;
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.3s ease;
  min-height: 40px;
}

.subscription-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.subscription-info {
  flex: 1;
  min-width: 0;
}

.subscription-keyword {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.keyword-code {
  background-color: #f0f2f5;
  color: #666;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.keyword-name {
  color: #333;
  font-weight: 500;
}

.subscription-author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.author-icon {
  font-size: 16px;
}

.author-name {
  color: #333;
  font-weight: 500;
}

.subscription-description {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.no-subscriptions {
  text-align: center;
  padding: 40px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subscription-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .subscription-item .el-button {
    align-self: flex-end;
  }
}
</style> 