import axios from "axios";
import {callError} from "@/call";
import {useStore} from "vuex";

export async function canUseAI() {
    try{
        const response =
            await axios.get(`/user/try-use-ai`);
        if(response.data.code === 0) {
            return response.data.data;
        }
        return false;
    } catch (error) {
        callError(error as string);
    }
}
