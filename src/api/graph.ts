import axios from "axios";
import {callError} from "@/call";

export async function getGraph(id: number) : Promise<any> {
    try {
        const response = await axios.get(`author/relationship?id=${id}`);
        if (response.status === 200) {
            if (response.data.code == 0) {

                // console.log('专家网络')
                // console.log(response)
                return response.data.data;

            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (error) {}
    return [];
}
