import axios from "axios";
import { callError } from "@/call";

interface AnswerVO {
    answerId: number;
    questionId: number;
    answerText: string;
    answeredAt: string;
    userId: number;
    userName: string;
    userAvatar: string;
    layer: number;
    parentAnswer: number;
    likeCount: number;
    isLiked: boolean;
}

interface QuestionVO {
    questionId: number;
    questionText: string;
    askedAt: string;
    userId: number;
    userName: string;
    userAvatar: string;
    answers: AnswerVO[];
    answerCount: number;
    likeCount: number;
    isLiked: boolean;
}

interface ListQuestionResponse {
    code: number;
    data: QuestionVO[];
    message: string;
}

interface QuestionCreateRequest {
  questionTitle: string;
  questionDescription: string;
}

interface BaseResponseLong {
  code: number;
  data: number;
  message: string;
}

export async function getQuestionList(params?: {
    current?: number;
    size?: number;
}): Promise<QuestionVO[]> {
    try {
        const response = await axios.get<ListQuestionResponse>('/question/list', {
            params: params
        });

        if (response.status === 200) {
            if (response.data.code === 0) {
                return response.data.data;
            } else {
                callError(response.data.message);
                return [];
            }
        } else {
            callError('网络错误');
            return [];
        }
    } catch (error) {
        callError('请求失败');
        return [];
    }
}

// 创建问题
export async function createQuestion(data: QuestionCreateRequest): Promise<BaseResponseLong> {
  try {
    const response = await axios.post('/question/create', data);
    if (response.status === 200) {
      return response.data;
    } else {
      return Promise.reject("创建问题失败: " + response.status);
    }
  } catch (error) {
    callError("创建问题失败: " + error);
    return Promise.reject("创建问题失败: " + error);
  }
} 