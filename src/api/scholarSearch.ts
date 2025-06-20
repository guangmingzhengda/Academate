import axios from "axios";
import {callSuccess, callError, callInfo, callWarning} from "@/call";
interface Condition {
    field: string;
    type: string;
    value: string;
}
// export async function getScholarData(data : {
//     pageNum:number,
//     pageSize:number,
//     conditionList: {field:string,type:string,value:string}[],
//     orderField: string|null,
//     ascending:boolean,
// } ) : Promise<any> {
//     try {
//         const response = await axios.post('/author/page', data);
//         if (response.status === 200)
//         {
//             if (response.data.code == 0){
//                 //callSuccess('获取学者信息成功');
//                 return response.data.data;
//             }
//             else{
//                 //callError(response.data.message);
//                 return [];
//             }
//         }
//         else{
//             //callError('网络错误');
//             return [];
//         }
//     } catch (error) {
//         //console.log('there are some errors in register');
//         return [];
//     }
// }
export async function getScholarData(data : {
    pageNum:number,
    pageSize:number,
    authorName:string|null,
    institutionName:string|null,
    orcid:string|null,
    orderField: string|null,
    ascending:boolean,
} ) : Promise<any> {
    try {
        const response = await axios.post('/author/pageEs', data);
        if (response.status === 200)
        {
            if (response.data.code == 0){
                callSuccess('获取学者信息成功');
                return response.data.data;
            }
            else{
                //callError(response.data.message);
                return [];
            }
        }
        else{
            //callError('网络错误');
            return [];
        }
    } catch (error) {
        //console.log('there are some errors in register');
        return [];
    }
}
