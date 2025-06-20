import axios from "axios";
import {callError} from "@/call";

export async function getInstitutionList(pageNum,pageSize): Promise<any>
{
    try
    {
        const response= await axios.get(`/institution/rank-yc-mean-citedness?pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.status===200)
        {
            // @ts-ignore
            return response.data.data;
        }
    }

    catch (error) {
        // callError("getInstitutionList出现问题");
    }
}
export async function getInstitution10_Index_List(pageNum,pageSize): Promise<any>
{
    try
    {
        const response= await axios.get(`/institution/rank-i10-index?pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.status===200)
        {
            // @ts-ignore
            return response.data.data;
        }
    }

    catch (error) {
        // callError("getInstitutionList出现问题");
    }
}
export async function getInstitutionh_Index_List(pageNum,pageSize): Promise<any>
{
    try
    {
        const response= await axios.get(`/institution/rank-h-index?pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.status===200)
        {
            // @ts-ignore
            return response.data.data;
        }
    }

    catch (error) {
        // callError("getInstitutionList出现问题");
    }
}
export async function getHotArea(Num): Promise<any>
{
    try
    {
        const response= await axios.get(`/work/subfield-rank?num=${Num}`);
        if(response.status===200)
        {
            // @ts-ignore
            return response.data.data;
        }

    }

    catch (error) {
        // callError("getHotArea出现问题");
    }
}
