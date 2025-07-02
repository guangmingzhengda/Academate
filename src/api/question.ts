import axios from "axios";
import { callError, callInfo } from "@/call";

interface AnswerVO {
    answerId: number;
    questionId: number;
    answerText: string;
    answeredAt: string;
    answeredEd: string;
    userId: number;
    userName: string;
    userAvatar: string;
    layer: number;
    parentAnswer: number | null;
    children: AnswerVO[] | null;
    likeCount: number;
    isLiked: boolean;
}

// 更新问题详情接口，与API文档保持一致
export interface QuestionDetailVO {
    questionId: number;
    questionTitle: string;
    questionDescription: string;
    askedAt: string;
    userId: number;
    userName: string;
    userAvatar: string;
    answers: AnswerVO[];
    answerCount: number;
    likeCount: number;
    isLiked: boolean;
    acceptAnswer?: number; // 被采纳的回答ID，如果为空则表示没有采纳的回答
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

// 问题详情响应接口
export interface QuestionDetailResponse {
    code: number;
    data: QuestionDetailVO;
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

/**
 * 获取问题详情
 * @param questionId 问题ID
 * @returns 问题详情数据
 */
export async function getQuestionDetail(questionId: number): Promise<QuestionDetailVO | null> {
  try {
    const response = await axios.get<QuestionDetailResponse>(`/question/${questionId}`);
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || "获取问题详情失败");
        return null;
      }
    } else {
      callError("获取问题详情失败: " + response.status);
      return null;
    }
  } catch (error) {
    callError("获取问题详情失败: " + error);
    return null;
  }
}

/**
 * 创建回答请求参数
 */
export interface AnswerCreateRequest {
  /** 问题ID */
  questionId: number;
  
  /** 回答内容 */
  answerText: string;
  
  /** 父回答ID（回复其他回答时使用） */
  parentAnswerId?: number;
}

/**
 * 创建回答
 * @param data 回答创建请求
 * @returns 创建的回答ID
 */
export async function createAnswer(data: AnswerCreateRequest): Promise<number | null> {
  try {
    const response = await axios.post<BaseResponseLong>('/question/answer', data);
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data; // 返回创建的回答ID
      } else {
        callError(response.data.message || "创建回答失败");
        return null;
      }
    } else {
      callError("创建回答失败: " + response.status);
      return null;
    }
  } catch (error) {
    callError("创建回答失败: " + error);
    return null;
  }
}

/**
 * 获取回答点赞数量
 * @param answerId 回答ID
 * @returns 点赞数量
 */
export async function getAnswerLikeCount(answerId: number): Promise<number> {
  try {
    const response = await axios.post<BaseResponseLong>('/answer_like/like_count', null, {
      params: {
        answerId
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      // console.error("获取点赞数量失败:", response.data.message);
      return 0;
    }
  } catch (error) {
    // console.error("获取点赞数量失败:", error);
    return 0;
  }
}

/**
 * 点赞回答
 * @param uid 用户ID
 * @param answerId 回答ID
 * @returns 是否点赞成功
 */
export async function likeAnswer(uid: number, answerId: number): Promise<boolean> {
  try {
    const response = await axios.post('/answer_like/like', null, {
      params: {
        uid,
        answerId
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      if(response.data.message.includes("java.sql.SQLIntegrityConstraintViolationException: Duplicate entry")) {
        callInfo("点赞失败，您已点赞，请刷新后查看");
        return false;
      }
      callError(response.data.message || "点赞失败");
      return false;
    }
  } catch (error) {
    callError("点赞失败: " + error);
    return false;
  }
}

/**
 * 取消点赞回答
 * @param uid 用户ID
 * @param answerId 回答ID
 * @returns 是否取消点赞成功
 */
export async function cancelLikeAnswer(uid: number, answerId: number): Promise<boolean> {
  try {
    const response = await axios.post('/answer_like/cancel_like', null, {
      params: {
        uid,
        answerId
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      callError(response.data.message || "取消点赞失败");
      return false;
    }
  } catch (error) {
    callError("取消点赞失败: " + error);
    return false;
  }
}

// 获取我关注的问题列表接口响应
export interface FollowedQuestionAnswerVO {
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

export interface FollowedQuestionVO {
    questionId: number;
    questionTitle: string;
    questionDescription: string;
    askedAt: string;
    userId: number;
    userName: string;
    userAvatar: string;
    answers: FollowedQuestionAnswerVO[];
    answerCount: number;
    likeCount: number;
    isLiked: boolean;
    followCount: number;
    isFollowed: boolean;
}

export interface BaseResponseListQuestionVO {
    code: number;
    data: FollowedQuestionVO[];
    message: string;
}

/**
 * 获取我关注的问题列表
 * @param params 分页参数
 * @returns 关注的问题列表
 */
export async function getMyFollowedQuestions(params?: { current?: number; size?: number }): Promise<FollowedQuestionVO[]> {
    try {
        const response = await axios.get<BaseResponseListQuestionVO>('/question/my/followed', {
            params: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.status === 200) {
            if (response.data.code === 0) {
                return response.data.data;
            } else {
                callError(response.data.message || '获取关注问题失败');
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

/**
 * 关注问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否成功
 */
export async function followQuestion(uid: number, questionId: number): Promise<boolean> {
    try {
        const response = await axios.post('/question/follow/follow', null, {
            params: { uid, questionId },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.status === 200 && response.data.code === 0) {
            return true;
        } else {
            callError(response.data.message || '关注失败');
            return false;
        }
    } catch (error) {
        callError('关注失败');
        return false;
    }
}

/**
 * 取消关注问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否成功
 */
export async function cancelFollowQuestion(uid: number, questionId: number): Promise<boolean> {
    try {
        const response = await axios.post('/question/follow/cancel_follow', null, {
            params: { uid, questionId },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.status === 200 && response.data.code === 0) {
            return true;
        } else {
            callError(response.data.message || '取消关注失败');
            return false;
        }
    } catch (error) {
        callError('取消关注失败');
        return false;
    }
}

/**
 * 采纳回答
 * @param questionId 问题ID
 * @param answerId 回答ID
 * @returns 是否采纳成功
 */
export async function acceptAnswer(questionId: number, answerId: number): Promise<boolean> {
  try {
    const response = await axios.post(`/question/${questionId}/accept/${answerId}`);
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      callError(response.data.message || "采纳回答失败");
      return false;
    }
  } catch (error) {
    callError("采纳回答失败: " + error);
    return false;
  }
}

/**
 * 删除回答
 * @param answerId 回答ID
 * @returns 是否删除成功
 */
export async function deleteAnswer(answerId: number): Promise<boolean> {
  try {
    // const response = await axios.post(`/question/answer/delete`, null, {
    //   params: { answerId },
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   }
    // });
    
    const response = await axios.post(`/question/answer/delete/${answerId}`);

    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      callError(response.data.message || "删除回答失败");
      return false;
    }
  } catch (error) {
    callError("删除回答失败: " + error);
    return false;
  }
}

/**
 * 回答更新请求
 */
export interface AnswerUpdateRequest {
  answerText: string;
}

/**
 * 编辑回答
 * @param answerId 回答ID
 * @param data 更新的回答内容
 * @returns 是否更新成功
 */
export async function updateAnswer(answerId: number, data: AnswerUpdateRequest): Promise<boolean> {
  try {
    const response = await axios.post(`/question/answer/update/${answerId}`, data);
    
    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      callError(response.data.message || "更新回答失败");
      return false;
    }
  } catch (error) {
    callError("更新回答失败: " + error);
    return false;
  }
}

/**
 * 获取问题点赞数量
 * @param questionId 问题ID
 * @returns 点赞数量
 */
export async function getQuestionLikeCount(questionId: number): Promise<number> {
  try {
    const response = await axios.post<BaseResponseLong>('/question_like/like_count', null, {
      params: { questionId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      // console.error("获取问题点赞数量失败:", response.data.message);
      return 0;
    }
  } catch (error) {
    // console.error("获取问题点赞数量失败:", error);
    return 0;
  }
}

/**
 * 点赞问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否点赞成功
 */
export async function likeQuestion(uid: number, questionId: number): Promise<boolean> {
  try {
    const response = await axios.post('/question_like/like', null, {
      params: { uid, questionId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      if(response.data.message.includes("java.sql.SQLIntegrityConstraintViolationException: Duplicate entry")) {
        callInfo("点赞失败，您已点赞，请刷新后查看");
        return false;
      }
      callError(response.data.message || "点赞问题失败");
      return false;
    }
  } catch (error) {
    callError("点赞问题失败: " + error);
    return false;
  }
}

/**
 * 取消点赞问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否取消点赞成功
 */
export async function cancelLikeQuestion(uid: number, questionId: number): Promise<boolean> {
  try {
    const response = await axios.post('/question_like/cancel_like', null, {
      params: { uid, questionId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return true;
    } else {
      callError(response.data.message || "取消点赞问题失败");  
      return false;
    }
  } catch (error) {
    callError("取消点赞问题失败: " + error);
    return false;
  }
}

/**
 * 检查是否点赞该问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否已点赞
 */
export async function isQuestionLiked(uid: number, questionId: number): Promise<boolean> {
  try {
    const response = await axios.post<{ code: number; data: boolean; message: string }>('/question_like/is_like', null, {
      params: { uid, questionId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      // console.error("检查问题点赞状态失败:", response.data.message);
      return false;
    }
  } catch (error) {
    // console.error("检查问题点赞状态失败:", error);
    return false;
  }
}

/**
 * 检查是否关注该问题
 * @param uid 用户ID
 * @param questionId 问题ID
 * @returns 是否已关注
 */
export async function isQuestionFollowed(uid: number, questionId: number): Promise<boolean> {
  try {
    const response = await axios.post<{ code: number; data: boolean; message: string }>('/question/follow/is_follow', null, {
      params: { uid, questionId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      // console.error("检查问题关注状态失败:", response.data.message);
      return false;
    }
  } catch (error) {
    // console.error("检查问题关注状态失败:", error);
    return false;
  }
} 