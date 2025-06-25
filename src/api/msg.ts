import axios from "axios";
import {callError, callSuccess} from "@/call";

// 消息数据类型定义
export interface MessageVO {
    messageId: number;
    senderId: number;
    receiverId: number;
    message: string;
    sentAt: string;
    projectId: number;
    status: string;
    isAccepted: string;
    avatar: string;
}

// 拉取所有消息响应类型
export interface PullMessagesResponse {
    code: number;
    data: MessageVO[];
    message: string;
}

// 标记已读请求类型
export interface MessageMarkReadRequest {
    messageIds: number[];
}

// 标记已读响应类型
export interface MarkAsReadResponse {
    code: number;
    data: number;
    message: string;
}

/**
 * 拉取所有消息
 * 根据prompt.md实现
 * 接口地址：/api/message/pull
 * 请求方式：POST
 * 请求数据类型：application/x-www-form-urlencoded
 */
export async function pullAllMessages(): Promise<MessageVO[] | null> {
    try {
        console.log('开始拉取所有消息');
        
        const response = await axios.post<PullMessagesResponse>('/message/pull', null, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log('拉取消息响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功拉取到 ${response.data.data.length} 条消息`);
                return response.data.data;
            } else {
                callError(response.data.message || '拉取消息失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('拉取消息错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '拉取消息失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('拉取消息失败，请重试');
        }
        return null;
    }
}

/**
 * 批量标记消息为已读
 * 接口地址: /api/message/markAsRead
 * 请求方式: POST
 * 请求示例: { "messageIds": [1, 2, 3] }
 */
export async function markAsRead(data: MessageMarkReadRequest): Promise<boolean> {
    try {
        console.log('开始标记消息为已读:', data);
        
        const response = await axios.post<MarkAsReadResponse>('/message/markAsRead', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('标记已读响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功标记 ${data.messageIds.length} 条消息为已读`);
                return true;
            } else {
                callError(response.data.message || '标记已读失败');
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error: any) {
        console.error('标记已读错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '标记已读失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('标记已读失败，请重试');
        }
        return false;
    }
}
