import axios from "axios";
import {callSuccess, callError, callInfo, callWarning} from "@/call";

export async function create_project(data : {
    title: string,
    description: string,
    creatorId: number
}) :Promise<boolean> {
    try {
        // console.log(data);
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
        const response = await axios.post('/project/agree', null, {
            params: {
                projectId: data.projectId,
                messageId: data.messageId
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        if (response.status === 200) {
            if (response.data.code == 0) {
                return true;
            } else {
                callError(response.data.message);
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
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
  return axios.post(`/project/invite`, params);
}
