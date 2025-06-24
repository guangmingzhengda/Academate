import axios from 'axios';
import { callSuccess, callError } from '@/call';

/**
 * 关注用户
 * @param followedId 被关注用户ID
 * @returns Promise<boolean>
 */
export async function followUser(followedId: number): Promise<boolean> {
    try {
        const response = await axios.post('/user/follow', null, {
            params: { followedId }
        });
        if (response.status === 200 && response.data.code === 0) {
            callSuccess('关注成功');
            return true;
        } else {
            callError(response.data.message || '关注失败');
            return false;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return false;
    }
}

/**
 * 取消关注用户
 * @param followedId 被取消关注用户ID
 * @returns Promise<boolean>
 */
export async function unfollowUser(followedId: number): Promise<boolean> {
    try {
        const response = await axios.post('/user/unfollow', null, {
            params: { followedId }
        });
        if (response.status === 200 && response.data.code === 0) {
            callSuccess('取关成功');
            return true;
        } else {
            callError(response.data.message || '取消关注失败');
            return false;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return false;
    }
}

/**
 * 获取当前用户关注的人员列表
 * @param userId 当前用户ID
 * @param current 当前页码
 * @param size 每页数量
 * @returns Promise<{records: Array<{userId:number, name:string, account:string, avatar:string}>, total:number, size:number, current:number} | null>
 */
export async function getFollowedUsers(userId: number, current: number, size: number): Promise<any> {
    try {
        const response = await axios.get('/user/followed_users', {
            params: { userId, current, size }
        });
        if (response.status === 200 && response.data.code === 0) {
            return response.data.data;
        } else {
            callError(response.data.message || '获取关注列表失败');
            return null;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return null;
    }
} 