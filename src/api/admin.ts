import axios from "axios";
import {callError, callSuccess} from "@/call";

export async function judgeClaim(data : {
    claimRequestId:number,
    userId:number,
    authorId:number,
    success:boolean,
    reason:string,
} ) : Promise<void>
{
    try {
        const response = await axios.post('/system/claim_result', data);
        if (response.status === 200)
        {
            if (response.data.code == 0) callSuccess('审核操作完成');
            else
            {

            };
        }
        else callError('网络错误');
    }
    catch (error) {

    }
}
export async function getClaimRegistedUserNum(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-user-count`);
        if(response.status===200)
        {
            result=response.data.data;
            return result;
        }
    }

    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}
export async function getActiveUser(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-login-count`);
        if(response.status===200)
        {
            result=response.data.data;
            return result;
        }
    }
    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}
export async function getFourKindsCount(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/work/get-work-count`);
        if(response.status===200)
        {
            result=response.data.data;
            return result;
        }
    }
    catch (error) {
        // callError("获取四种学术成果失败，后端缺少数据");
    }
}
export async function getArticleCount(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-work-count`);
        if(response.status===200)
        {
            result=response.data.data.articleCount;
            return result;
        }
    }
    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}

export async function getPatentCount(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-work-count`);
        if(response.status===200)
        {
            result=response.data.data.patentCount;
            return result;
        }
    }
    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}
export async function getProjectCount(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-work-count`);
        if(response.status===200)
        {
            result=response.data.data.projectCount;
            return result;
        }
    }
    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}
export async function getAwardCount(): Promise<any>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/get-work-count`);
        if(response.status===200)
        {
            result=response.data.data.awardCount;
            return result;
        }
    }

    catch (error) {
        // callError("getClaimRequestDetails出现问题");
    }
}
//获取Claim详细信息   这个应该切换成为申请号Id
export async function getClaimRequestDetails(claimRequestId): Promise<null>
{
    let result=null;
    try
    {
        const response=await axios.get(`/system/claim_request_material?claimRequestId=${claimRequestId}`);
        if(response.status===200)
        {
            result=response.data.data;
            // @ts-ignore
            return result;
        }
        return null;
    }

    catch (error) {
        return null;
        // callError("getClaimRequestDetails出现问题");
    }
}

//获取认证申请列表   get方法
// @ts-ignore
export async function getClaimList(pageNum,pageSize): Promise<any>
{
    let nullList= new Array;
    try
    {
        console.log("检查调用参数"+pageNum+" "+pageSize);
        const response=await axios.get(`/system/claim_request_list?pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.status===200)
        {
            // @ts-ignore
            if(response.data.data.claimRequestVOList.length>0)
            {
                return response.data.data;
            }
            return nullList;

        }
    }

    catch (error) {
        // callError("getClaimList出现问题");
    }
}
export async function getResidentScholars(pageNum,pageSize): Promise<any>
{
    try
    {
        const response=await axios.get(`/author/resident-author-page?pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.status===200)
        {
            // @ts-ignore
            return response.data.data;
        }
    }

    catch (error) {
        // callError("没有入驻学者");
    }
}
