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