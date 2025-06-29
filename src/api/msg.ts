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
    outcomeId: number; // 成果ID，用于数据请求处理
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

// 全文请求申请处理请求类型
export interface ApplyAgreeRequest {
    agree: boolean;
    outcomeId: number;
    messageId: number;
    multipartFile?: File;
}

// 全文请求申请处理响应类型
export interface ApplyAgreeResponse {
    code: number;
    data: any;
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

/**
 * 处理全文请求申请（同意/拒绝）
 * 接口地址: /api/research_outcome/apply_agree
 * 请求方式: POST
 * 请求数据类型: application/x-www-form-urlencoded,application/json
 */
export async function handleApplyAgree(data: ApplyAgreeRequest): Promise<boolean> {
    try {
        console.log('开始处理全文请求申请:', data);
        
        // 使用FormData来支持文件上传
        const formData = new FormData();
        formData.append('agree', data.agree.toString());
        formData.append('outcomeId', data.outcomeId.toString());
        formData.append('messageId', data.messageId.toString());
        
        if (data.multipartFile) {
            formData.append('multipartFile', data.multipartFile);
        }
        
        const response = await axios.post<ApplyAgreeResponse>('/research_outcome/apply_agree', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log('处理全文请求申请响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log('全文请求申请处理成功');
                return true;
            } else {
                callError(response.data.message || '处理申请失败');
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error: any) {
        console.error('处理全文请求申请错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '处理申请失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('处理申请失败，请重试');
        }
        return false;
    }
}
