import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { List, number } from "echarts";

// 用户详细信息类型定义
interface UserDetail {
    id: number;
    account: string;
    email: string;
    institution: string;
    field: string;
    profile: string;
    avatar: string;
    createTime: string;
    researchOutcomes: Array<{
        outcomeId: number;
        type: string;
        title: string;
        authors: string;
        journal: string;
        volume: number;
        issue: number;
        pages: number;
        publishDate: string;
        doi: string;
        url: string;
        patentNumber: string;
        likeCount: number;
        authorOrder: number;
    }>;
    name: string;
    department: string;
    jobTitle: string;
    highestDegree: string;
    graduateSchool: string;
    major: string;
    graduationDate: string;
    totalOutcomeLikes: number;
    followersCount: number;
}

// 搜索科研人员的请求参数类型
interface UserSearchRequest {
    userName?: string;
    field?: string;
    researchTitle?: string;
    institution?: string;
    current?: number;
    pageSize?: number;
}

// 研究成果类型
interface ResearchOutcomeVO {
    outcomeId: number;
    type: string;
    title: string;
    authors: string;
    journal: string;
    volume: number;
    issue: number;
    pages: number;
    publishDate: string;
    doi: string;
    url: string;
    patentNumber: string;
}

// 用户详情类型
interface UserDetailVO {
    id: number;
    account: string;
    email: string;
    institution: string;
    field: string;
    profile: string;
    avatar: string;
    createTime: string;
    researchOutcomes: ResearchOutcomeVO[];
    name: string;
}

// 分页结果类型
interface PageResultUserDetailVO {
    pageNum: number;
    pageSize: number;
    total: number;
    list: UserDetailVO[];
}

/*
获取用户基本信息
返回示例：
{
	"code": 0,
	"data": {
		"id": 0,
		"account": "",
		"email": "",
		"institution": "",
		"field": "",
		"profile": "",
		"avatar": "",
		"createTime": "",
		"name": "",
		"researchOutcomes": [
			{
				"outcomeId": 0,
				"type": "",
				"title": "",
				"authors": "",
				"journal": "",
				"volume": 0,
				"issue": 0,
				"pages": 0,
				"publishDate": "",
				"doi": "",
				"url": "",
				"patentNumber": ""
			}
		]
	},
	"message": ""
}
*/
export async function get_user_detail(data : {
  userId: number
}) :Promise<UserDetail | null> {
  try {
      const response = await axios.get(`/user/detail/${data.userId}`);
      if (response.status === 200){
          if (response.data.code == 0) {
              return response.data.data; // 返回用户详细信息
          }
          else{
              callError(response.data.message);
              return null;
          }
      }
      else {
          callError('网络错误');
          return null;
      }
  }

  catch (error){
      callError('网络错误或服务器异常');
      return null;
  }
}

/*
搜索科研人员
接口地址: /api/user/search
请求方式: POST
请求示例：
{
  "userName": "",
  "field": "",
  "researchTitle": "",
  "institution": "",
  "current": 0,
  "pageSize": 0
}
*/
export async function search_researchers(data: UserSearchRequest): Promise<PageResultUserDetailVO | null> {
    try {
        const response = await axios.post('/user/search', data);
        if (response.status === 200) {
            if (response.data.code === 0) {
                return response.data.data; // 返回分页搜索结果
            } else {
                callError(response.data.message);
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return null;
    }
}

/*
上传用户头像
返回示例：
{
	"code": 0,
	"data": "头像URL",
	"message": ""
}
*/
export async function upload_user_avatar(file: File): Promise<string | null> {
  try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/user/avatar', formData, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      
      if (response.status === 200) {
          if (response.data.code === 0) {
              return response.data.data; // 返回头像URL
          } else {
              callError(response.data.message);
              return null;
          }
      } else {
          callError('网络错误');
          return null;
      }
  } catch (error: any) {
      // 检查是否是413错误（请求实体过大）
      if (error.response && error.response.status === 413) {
          callError('上传文件过大！');
      } else {
          callError('网络错误或服务器异常');
      }
      return null;
  }
}

/*
修改用户个人信息
请求示例：
{
  "institution": "",
  "userProfile": "",
  "avatar": "",
  "field": "",
  "name": "",
  "department": "",
  "jobTitle": "",
  "highestDegree": "",
  "graduateSchool": "",
  "major": "",
  "graduationDate": ""
}
返回示例：
{
	"code": 0,
	"data": "修改成功",
	"message": ""
}
*/
export async function update_user_info(data: {
  institution?: string;
  userProfile?: string;
  avatar?: string;
  field?: string;
  name?: string;
  department?: string;
  jobTitle?: string;
  highestDegree?: string;
  graduateSchool?: string;
  major?: string;
  graduationDate?: string;
}): Promise<boolean> {
  try {
      const response = await axios.post('/user/info_update', data);
      
      if (response.status === 200) {
          if (response.data.code === 0) {
              return true; // 修改成功
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
