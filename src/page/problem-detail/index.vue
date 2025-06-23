<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
        <div style="width: 1400px">
            <el-container class="el-main" style="display: flex;">
                <el-row style="width: 100%">
                    <el-col :span="18">
                        <div class="main-container" style="width: 100%;">
                            <div v-if="problem.problemDetail !== null">
                                <div class="header-container">
                                    <div class="header-title">{{ problem.problemDetail.title }}</div>
                                    <div class="info-container">
                                        <div class="detail-info">
                                            <span class="info-label">提问者：</span>
                                            <span>{{ problem.problemDetail.asker.name }}</span>
                                        </div>
                                        <div class="detail-info" v-if="problem.problemDetail.createTime">
                                            <span class="info-label">提问时间：</span>
                                            <span>{{ formatDate(problem.problemDetail.createTime) }}</span>
                                        </div>
                                        <div class="detail-info" v-if="problem.problemDetail.status">
                                            <span class="info-label">问题状态：</span>
                                            <span class="status-badge" :class="getStatusClass(problem.problemDetail.status)">
                                                {{ problem.problemDetail.status }}
                                            </span>
                                        </div>
                                        <div class="detail-info" v-if="problem.problemDetail.tags && problem.problemDetail.tags.length">
                                            <span class="info-label">标签：</span>
                                            <span v-for="(tag, idx) in problem.problemDetail.tags" :key="idx" class="tag">{{ tag }}</span>
                                        </div>
                                    </div>
                                    <function-bar :work="problem" :achievement-name="problem.problemDetail.title" :role="role"/>
                                </div>
                                <div class="down-container">
                                    <div class="abstract-title">问题描述</div>
                                    <div class="abstract-content" id="description">
                                        {{ problem.problemDetail.description === '' ? '该问题暂无详细描述' : problem.problemDetail.description }}
                                    </div>
                                </div>
                                <div class="down-container">
                                    <el-tabs
                                        v-model="activeName"
                                        type="card"
                                        class="demo-tabs"
                                        style="max-width: 100%">
                                        <el-tab-pane label="评论" name="third">
                                            <comments :work="problem" :userId="userId" :role="role"/>
                                        </el-tab-pane>
                                    </el-tabs>
                                </div>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="6">
                        <div class="side-container">
                            <side-component :work="problem"/>
                        </div>
                    </el-col>
                </el-row>
            </el-container>
        </div>
    </div>
</template>

<script lang="js">
import SideComponent from "@/page/project-detail/side-component/index.vue";
import {ref} from "vue";
import FunctionBar from "@/page/project-detail/function-bar/index.vue";
import Comments from "@/page/project-detail/comments/index.vue";
import {callInfo} from "@/call";
import store from "@/store";

export default {
    name: "problem-detail",
    components: {Comments, FunctionBar, SideComponent},
    data() {
        return {
            userId: ref(0),
            problem: ref({
                id: 1,
                type: "problem",
                problemDetail: {
                    id: 1,
                    title: "如何高效准备算法竞赛？",
                    description: "请问大家在准备算法竞赛时，有哪些高效的学习方法和资源推荐？",
                    createTime: "2024-06-01 10:00:00",
                    status: "未解决",
                    asker: {
                        id: 101,
                        name: "小明"
                    },
                    tags: ["算法竞赛", "学习方法", "资源推荐"]
                },
                visitCount: 56,
                comments: 3,
                favorites: 2
            }),
            role: ref(""),
            activeName: ref("third"),
        };
    },
    methods: {
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
        },
        getStatusClass(status) {
            if (status === '未解决') return 'status-unresolved';
            if (status === '已解决') return 'status-resolved';
            return '';
        }
    }
}
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
.header-container {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
    margin-bottom: 24px;
}
.header-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 12px;
}
.info-container {
    margin-bottom: 12px;
}
.detail-info {
    margin-bottom: 8px;
    font-size: 15px;
}
.info-label {
    color: #888;
    margin-right: 8px;
}
.status-badge {
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 13px;
    margin-left: 6px;
}
.status-unresolved {
    background: #ffeaea;
    color: #e74c3c;
}
.status-resolved {
    background: #eaffea;
    color: #27ae60;
}
.tag {
    background: #e0eafc;
    color: #3b5998;
    border-radius: 6px;
    padding: 2px 8px;
    margin-right: 6px;
    font-size: 13px;
}
.down-container {
    margin-top: 24px;
}
.abstract-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
}
.abstract-content {
    font-size: 15px;
    color: #333;
    line-height: 1.7;
    background: #f8fafd;
    border-radius: 8px;
    padding: 16px;
}
.side-container {
    margin-left: 24px;
}
</style> 