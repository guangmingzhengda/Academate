import axios from "axios";
import {callError} from "@/call";

// 获取用户关系网络
export const getKnowledgeGraphNetwork = async (userId?: number, institution?: string) => {
    try {
        const params: any = {};
        if (userId) params.userId = userId;
        if (institution) params.institution = institution;
        
        const response = await axios.get('/knowledge-graph/network', { params });
        return response.data;
    } catch (error) {
        console.error('获取知识图谱网络失败:', error);
        callError('获取知识图谱数据失败');
        return null;
    }
};




