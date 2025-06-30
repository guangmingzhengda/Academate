import axios from "axios";
import {callSuccess, callError, callInfo, callWarning} from "@/call";

export async function create_project(data : {
    title: string,
    description: string,
    creatorId: number,
    isPublic: boolean,
    collaborationRequirement?: string
}) :Promise<boolean> {
    try {
        // // console.log(data);
        const response = await axios.post('/project/create', data);
        if (response.status === 200){
            if (response.data.code == 0) {
                // callSuccess('创建成功'); // 让调用方处理成功消息
                return true;
            }
            else{
                callError(response.data.message);
                return false;
            }
        }
        else {
            // callError('网络错误');
            return false;
        }
    }

    catch (error){
        callError('网络错误或服务器异常');
        return false;
    }
}

/*
同意项目邀请（申请）：对接前端 components/MessageSidebar.vue
POST
url: project/agree
请求数据类型：application/x-www-form-urlencoded

参数名称 请求类型 是否必须 数据类型
projectId query true integer(int64)
messageId query true integer(int64)

返回示例：
{
	"code": 0,
	"data": {},
	"message": ""
}
*/
export async function agree_project_invite(data: {
    projectId: number,
    messageId: number
}): Promise<boolean> {
    try {
        // console.log('同意项目邀请请求数据:', data);
        
        const response = await axios.post('/project/agree', null, {
            params: {
                projectId: data.projectId,
                messageId: data.messageId
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        // console.log('同意项目邀请响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code == 0) {
                return true;
            } else {
                callError(response.data.message || '同意失败');
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error: any) {
        // console.error('同意项目邀请错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '同意失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('同意失败，请重试');
        }
        return false;
    }
}

// 参数接口
export interface InviteParams {
  /* 邀请者ID */
  inviter?: number;

  /* 被邀请者ID数组 */
  invitee?: number[];

  /* 项目ID */
  projectId?: number;

  /* 项目标题 */
  title?: string;
}

// 响应接口
export interface InviteRes {
  /* 响应码 */
  code: number;

  /* 响应数据 */
  data: Record<string, unknown>;

  /* 响应消息 */
  message: string;
}

/** 
 * 邀请研究人员进入项目
 * @param {object} params ProjectInviteRequest
 * @param {number} params.inviter 邀请者ID
 * @param {array} params.invitee 被邀请者ID数组
 * @param {number} params.projectId 项目ID
 * @param {string} params.title 项目标题
 * @returns Promise<InviteRes> 邀请结果
 */
export function invite(params: InviteParams): Promise<InviteRes> {
  return axios.post(`/project/invite`, params).then(res => res.data);
}

/**
 * 获取用户参与的项目列表
 * @param userId 用户ID
 * @returns Promise<UserProjectVO[]>
 */
export async function get_user_projects(userId: number): Promise<any[]> {
    try {
        const response = await axios.get('/user/projects', {
            params: { userId }
        });
        if (response.status === 200 && response.data.code === 0) {
            return response.data.data || [];
        } else {
            callError(response.data.message || '获取项目列表失败');
            return [];
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return [];
    }
}

/*
拒绝项目邀请（申请）：对接前端 components/MessageSidebar.vue
POST
url: project/reject
请求数据类型：application/x-www-form-urlencoded

参数名称 请求类型 是否必须 数据类型
messageId query true integer(int64)
senderId query true integer(int64)

返回示例：
{
	"code": 0,
	"data": {},
	"message": ""
}
*/
export async function reject_project_invite(data: {
    messageId: number,
    senderId: number
}): Promise<boolean> {
    try {
        // console.log('拒绝项目邀请请求数据:', data);
        
        const response = await axios.post('/project/reject', null, {
            params: {
                messageId: data.messageId,
                senderId: data.senderId
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        // console.log('拒绝项目邀请响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code == 0) {
                return true;
            } else {
                callError(response.data.message || '拒绝失败');
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error: any) {
        // console.error('拒绝项目邀请错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '拒绝失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('拒绝失败，请重试');
        }
        return false;
    }
}

// 分页响应数据接口
export interface IPageResearchProject {
    size: number;
    current: number;
    total: number;
    records: ResearchProject[];
    pages: number;
}

// 项目数据接口
export interface ResearchProject {
    projectId: number;
    title: string;
    description: string;
    startDate: string;
    status: string;
}

// 基础响应接口
export interface BaseResponseIPageResearchProject {
    code: number;
    data: IPageResearchProject;
    message: string;
}

/*
按照分页获取数据库所有项目：对接前端
GET
url: /api/project/all
请求数据类型：application/x-www-form-urlencoded

参数名称 请求类型 是否必须 数据类型
page query true integer(int32)
size query true integer(int32)

返回示例：
{
	"code": 0,
	"data": {
		"size": 0,
		"current": 0,
		"total": 0,
		"records": [
			{
				"projectId": 0,
				"title": "",
				"description": "",
				"startDate": "",
				"status": ""
			}
		],
		"pages": 0
	},
	"message": ""
}
*/
export async function get_all_projects(data: {
    page: number,
    size: number
}): Promise<IPageResearchProject | null> {
    try {
        const response = await axios.get('/project/all', {
            params: {
                page: data.page,
                size: data.size
            }
        });
        
        if (response.status === 200) {
            if (response.data.code == 0) {
                return response.data.data;
            } else {
                callError(response.data.message || '获取项目列表失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        // console.error('获取所有项目错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '获取项目列表失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('获取项目列表失败，请重试');
        }
        return null;
    }
}

// 项目申请请求接口
export interface ProjectApplyRequest {
  /* 申请人ID */
  applicant?: number;
  
  /* 项目ID */
  projectId?: number;
  
  /* 项目标题 */
  title?: string;
}

// 基础响应接口
export interface BaseResponse {
  /* 响应码 */
  code: number;
  
  /* 响应数据 */
  data: any;
  
  /* 响应消息 */
  message: string;
}

/**
 * 申请加入项目
 * @param {object} params ProjectApplyRequest
 * @param {number} params.applicant 申请人ID
 * @param {number} params.projectId 项目ID
 * @param {string} params.title 项目标题
 * @returns Promise<BaseResponse> 申请结果
 */
export async function applyJoinProject(params: ProjectApplyRequest): Promise<BaseResponse> {
  try {
    console.log('申请加入项目请求数据:', params);
    
    // 修改请求URL为后端文档中的/api/project/application
    const response = await axios.post('/project/application', params);
    
    console.log('申请加入项目响应:', response.data);
    
    if (response.data.code === 0) {
      callSuccess('申请已成功发送，请等待项目管理员审核');
    } else {
      callError(response.data.message || '申请发送失败');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('申请加入项目错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '申请发送失败');
      return error.response.data;
    } else {
      callError('网络错误或服务器异常，请稍后重试');
      return {
        code: -1,
        data: null,
        message: '网络错误或服务器异常'
      };
    }
  }
}

/**
 * 删除项目
 * @param projectId 项目ID
 * @returns Promise<boolean> 是否删除成功
 */
export async function deleteProject(projectId: number): Promise<boolean> {
  try {
    // console.log('删除项目请求，项目ID:', projectId);
    
    const response = await axios.post('/project/delete', null, {
      params: { projectId }
    });
    
    // console.log('删除项目响应:', response.data);
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess('项目已成功删除');
      return true;
    } else {
      callError('删除项目失败: ' + (response.data.message || '未知错误'));
      return false;
    }
  } catch (error: any) {
    // console.error('删除项目错误:', error);
    if (error.response) {
      callError('删除项目失败: ' + (error.response.data?.message || '服务器错误'));
    } else {
      callError('删除项目失败: 网络错误或服务器异常');
    }
    return false;
  }
}

/**
 * 结束项目
 * @param projectId 项目ID
 * @returns Promise<boolean> 是否结束成功
 */
export async function completeProject(projectId: number): Promise<boolean> {
  try {
    // console.log('结束项目请求，项目ID:', projectId);
    
    const response = await axios.post('/project/complete', null, {
      params: { projectId }
    });
    
    // console.log('结束项目响应:', response.data);
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess('项目已成功结束');
      return true;
    } else {
      callError('结束项目失败: ' + (response.data.message || '未知错误'));
      return false;
    }
  } catch (error: any) {
    // console.error('结束项目错误:', error);
    if (error.response) {
      callError('结束项目失败: ' + (error.response.data?.message || '服务器错误'));
    } else {
      callError('结束项目失败: 网络错误或服务器异常');
    }
    return false;
  }
}

/**
 * 删除项目评论
 * @param commentId 评论ID
 * @returns 是否删除成功
 */
export async function deleteProjectComment(commentId: number): Promise<boolean> {
  try {
    // console.log('准备删除项目评论，评论ID:', commentId);
    const response = await axios.post('/api/project/comment/delete', null, {
      params: { commentId }
    });
    // console.log('删除项目评论响应:', response);
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess("评论已删除");
      return true;
    } else {
      callError("删除评论失败: " + (response.data.message || "未知错误"));
      return false;
    }
  } catch (error: any) {
    // console.error('删除评论异常:', error);
    if (error.response) {
      if (error.response.status === 403) {
        callError("无权限删除他人评论");
      } else {
        callError("删除评论失败: " + (error.response.data?.message || "未知错误"));
      }
    } else {
      callError("删除评论失败: " + (error.message || error));
    }
    return false;
  }
}

/**
 * 更新项目公开状态
 * @param projectId 项目ID
 * @param isPublic 是否公开
 * @returns Promise<boolean> 是否更新成功
 */
export async function updateProjectVisibility(projectId: number, isPublic: boolean): Promise<boolean> {
  try {
    const response = await axios.post('/project/visibility/update', {
      projectId,
      isPublic
    });
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess(isPublic ? '项目已设为公开' : '项目已设为私密');
      return true;
    } else {
      callError('更新项目可见性失败: ' + (response.data.message || '未知错误'));
      return false;
    }
  } catch (error: any) {
    if (error.response) {
      callError('更新项目可见性失败: ' + (error.response.data?.message || '服务器错误'));
    } else {
      callError('更新项目可见性失败: 网络错误或服务器异常');
    }
    return false;
  }
}
