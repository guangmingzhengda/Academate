import axios from "axios";
import {callError, callSuccess} from "@/call";

// 聊天用户信息
export interface ChatUserVO {
    userId: number;
    name: string;
    account: string;
    avatar: string;
}

// 会话信息
export interface ConversationVO {
    id: number;
    chatUserVO: ChatUserVO;
    initiatorId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

// 聊天消息信息
export interface MessageVO {
    messageId: number;
    senderId: number;
    receiverId: number;
    message: string;
    sentAt: string;
    projectId: number;
    status: string;
    isAccepted: string;
    type: string;
    avatar: string;
}

// 获取会话列表响应类型
export interface ListConversationResponse {
    code: number;
    data: ConversationVO[];
    message: string;
}

// 获取聊天记录响应类型
export interface ListChatMessagesResponse {
    code: number;
    data: MessageVO[];
    message: string;
}

/**
 * 获取所有会话列表
 * 接口地址：/api/message/listConversation
 * 请求方式：GET
 * 请求数据类型：application/x-www-form-urlencoded
 */
export async function listConversations(): Promise<ConversationVO[] | null> {
    try {
        console.log('开始获取会话列表');
        
        const response = await axios.get<ListConversationResponse>('/message/listConversation', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log('获取会话列表响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功获取到 ${response.data.data.length} 个会话`);
                return response.data.data;
            } else {
                callError(response.data.message || '获取会话列表失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('获取会话列表错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '获取会话列表失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('获取会话列表失败，请重试');
        }
        return null;
    }
}

/**
 * 获取聊天记录
 * 接口地址：/api/message/listChatMessages
 * 请求方式：GET
 * 请求数据类型：application/x-www-form-urlencoded
 * @param conversationId 会话ID
 */
export async function listChatMessages(conversationId: number): Promise<MessageVO[] | null> {
    try {
        console.log('开始获取聊天记录，会话ID:', conversationId);
        
        const response = await axios.get<ListChatMessagesResponse>('/message/listChatMessages', {
            params: { conversationId },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log('获取聊天记录响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功获取到 ${response.data.data.length} 条聊天记录`);
                return response.data.data;
            } else {
                callError(response.data.message || '获取聊天记录失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('获取聊天记录错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '获取聊天记录失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('获取聊天记录失败，请重试');
        }
        return null;
    }
}

/**
 * 创建会话
 * 接口地址：/api/message/create
 * 请求方式：POST
 * 请求数据类型：application/x-www-form-urlencoded
 * @param userId 要与之会话的用户ID
 */
export async function createConversation(userId: number): Promise<ConversationVO | null> {
    try {
        console.log('开始创建会话，用户ID:', userId);
        
        const response = await axios.post<{code: number; data: ConversationVO; message: string}>('/message/create', null, {
            params: { id: userId },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log('创建会话响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log('成功创建会话:', response.data.data);
                return response.data.data;
            } else {
                callError(response.data.message || '创建会话失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('创建会话错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '创建会话失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('创建会话失败，请重试');
        }
        return null;
    }
} 