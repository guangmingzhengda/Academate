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
                            v-for="user in currentList" 
                            :key="user.userId" 
                            class="user-item"
                        >
                            <div class="user-info" style="display: flex; align-items: flex-start;">
                                <div class="avatar-section">
                                    <img :src="user.avatar || defaultAvatar" alt="用户头像" class="user-avatar" @error="handleAvatarError"/>
                                </div>
                                <div class="info-section">
                                    <div class="info-header">
                                        <span class="user-name">{{ user.name || '未知用户' }}</span>
                                        <span v-if="user.field" class="user-field">{{ user.field }}</span>
                                    </div>
                                    <div class="profile-text">
                                        <div class="info-row">
                                            <span class="info-label">个人简介：</span>
                                            <span class="info-content">{{ user.profile || '这个人很神秘，什么都没有留下~' }}</span>
                                        </div>
                                    </div>
                                    <div class="info-footer">
                                        <div class="info-row">
                                            <span class="info-label">所属机构：</span>
                                            <span class="info-content">{{ user.institution || '暂无' }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">部门：</span>
                                            <span class="info-content">{{ user.department || '暂无' }}</span>
                                        </div>
                                    </div>
                                    <div class="info-footer">
                                        <div class="info-row">
                                            <span class="info-label">职称：</span>
                                            <span class="info-content">{{ user.jobTitle || '暂无' }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Email：</span>
                                            <span class="info-content">{{ user.email || '暂无' }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="action-buttons">
                                    <el-button type="primary" plain size="small" style="width: 80px;" @click="viewProfile(user.userId)">
                                        查看主页
                                    </el-button>
                                    <el-button 
                                        v-if="followTab === 'following'" 
                                        type="danger" 
                                        plain 
                                        size="small"
                                        style="width: 80px;"
                                        @click="handleUnfollow(user.userId)"
                                    >
                                        取消关注
                                    </el-button>
                                    <el-button 
                                        v-else-if="!user.isFollowing"
                                        type="primary" 
                                        size="small"
                                        style="width: 80px;"
                                        @click="handleFollow(user.userId)"
                                    >
                                        关注
                                    </el-button>
                                    <el-button 
                                        v-else
                                        type="info" 
                                        plain
                                        size="small"
                                        style="width: 80px;"
                                        @click="handleUnfollow(user.userId)"
                                    >
                                        已关注
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <el-pagination
                        v-if="total > pageSize"
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="total"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { callSuccess, callError } from '@/call'
import { ElMessageBox } from 'element-plus'
import router from '@/router'
import { getFollowedUsers, getFollowers, followUser, unfollowUser } from '@/api/follow'
import store from '@/store'

export default {
    name: 'followManager',
    props: {
        defaultTab: {
            type: String,
            default: 'following'
        },
        userId: {
            type: Number,
            required: true
        }
    },
    setup(props) {
        const route = useRoute();
        const currentLoginUserId = computed(() => store.getters.getData.id);
        const profileId = computed(() => props.userId);

        const followTab = ref(props.defaultTab)
        
        const currentPage = ref(1)
        const pageSize = ref(5)
        const total = ref(0)
        
        const followingList = ref([])
        const followersList = ref([])
        const followedUserIds = ref(new Set());
        
        const defaultAvatar = require('@/asset/home/user.png');

        const fetchFollowedUserIds = async () => {
            if (!currentLoginUserId.value) return;
            const res = await getFollowedUsers(currentLoginUserId.value, 1, 1000); // 获取所有关注的人
            if (res && res.records) {
                followedUserIds.value = new Set(res.records.map(u => u.userId));
            }
        };

        const fetchFollowing = async () => {
            const res = await getFollowedUsers(profileId.value, currentPage.value, pageSize.value)
            if (res) {
                followingList.value = res.records
                total.value = res.total
            }
        }
        
        const fetchFollowers = async () => {
            const res = await getFollowers(profileId.value, currentPage.value, pageSize.value)
            if (res) {
                // Check if current user is following these followers
                await fetchFollowedUserIds();
                followersList.value = res.records.map(follower => ({
                    ...follower,
                    isFollowing: followedUserIds.value.has(follower.userId)
                }));
                total.value = res.total;
            }
        }
        
        const fetchData = () => {
            currentPage.value = 1;
            if (followTab.value === 'following') {
                fetchFollowing()
            } else {
                fetchFollowers()
            }
        }

        onMounted(() => {
            fetchData()
        });

        watch(() => props.defaultTab, (newTab) => {
            followTab.value = newTab;
            fetchData();
        });

        const currentList = computed(() => {
            console.log('current', followingList.value)
            return followTab.value === 'following' ? followingList.value : followersList.value
        })
        
        const handlePageChange = (page) => {
            currentPage.value = page
            if (followTab.value === 'following') {
                fetchFollowing()
            } else {
                fetchFollowers()
            }
        }
        
        const handleAvatarError = (event) => {
            event.target.src = defaultAvatar;
        }
        
        const viewProfile = (userId) => {
            router.push({ name: 'profile', params: { id: userId } })
        }
        
        const handleUnfollow = async (userId) => {
            // await ElMessageBox.confirm('确定要取消关注这位用户吗？', '确认操作', {
            //     confirmButtonText: '确定',
            //     cancelButtonText: '取消',
            //     type: 'warning'
            // })
            const success = await unfollowUser(userId);
            if(success) {
                if (followTab.value === 'following') {
                    fetchFollowing(); // 重新加载关注列表
                } else {
                    const user = followersList.value.find(u => u.userId === userId);
                    if (user) user.isFollowing = false;
                }
            }
        }

        const handleFollow = async (userId) => {
            const success = await followUser(userId);
            if (success) {
                if (followTab.value === 'followers') {
                    const user = followersList.value.find(u => u.userId === userId);
                    if(user) user.isFollowing = true;
                }
            }
        }

        return {
            followTab,
            currentPage,
            pageSize,
            total,
            currentList,
            handlePageChange,
            handleAvatarError,
            viewProfile,
            handleUnfollow,
            handleFollow,
            defaultAvatar,
        }
    }
}
</script>

<style scoped>
.follow-manager {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.follow-content {
    margin-top: 10px;
}

.section-card {
    margin-bottom: 20px;
}

.card-header {
    padding: 15px 0;
    border-bottom: 1px solid #eee;
}

.card-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
}

.card-content {
    padding: 20px 0;
}

.empty-state {
    text-align: center;
    color: #909399;
    padding: 30px 0;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.user-item {
    border: 1px solid #e8e8e8;
    padding: 12px 15px;
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    position: relative;
    background: #fff;
    border-radius: 12px;
}

.user-item:hover {
    box-shadow: 0 8px 24px rgba(44,90,160,0.13), 0 1.5px 6px rgba(44,90,160,0.10);
    border-color: #22529a55;
    background: #fdfeff;
    z-index: 2;
}

.avatar-section {
    margin-right: 15px;
}

.user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e0e0e0;
}

.info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin-left: 15px;
}

.info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.user-name {
    font-size: 18px;
    font-weight: 600;
    color: #2c5aa0;
}

.user-field {
    background: #e8f4fd;
    color: #1890ff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 13px;
    margin-left: 8px;
}

.profile-text {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
}

.info-footer {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 30px;
}

.info-row {
    display: flex;
    align-items: top;
    font-size: 14px;
    color: #444;
    min-width: 180px;
    margin-top: 2px;
}

.info-label {
    color: #888;
    font-weight: 500;
    margin-right: 4px;
    min-width: 70px;
    text-align: right;
    line-height: 22px;
}

.info-content {
    display: inline-flex;
    align-items: center;
}

.action-buttons {
    position: absolute;
    right: 20px;
    top: 18px;
    z-index: 2;
    gap: 10px;
}

.action-buttons .el-button {
    font-size: 13px;
    width: 80px !important;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}
</style> 