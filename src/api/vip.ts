import axios from "axios";
import {callError} from "@/call";
import {useStore} from "vuex";

export async function becomeVip() : Promise<any> {
    try{
        const store = useStore();
        const response = await axios.get('user/become-vip');
        if (response.status === 200) {
            if (response.data.code == 0) {
                store.commit('setVipState', true);
            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (e){}
}

export async function checkVip() : Promise<boolean> {
    try{
        const store = useStore();
        const response = await axios.get('user/try/use-api');
        if (response.status === 200) {
            if (response.data.code == 0) {
                return response.data.data;
            }else callError(response.data.message);
        } else callError('网络错误');
    }catch (e){}
    return false;
}
