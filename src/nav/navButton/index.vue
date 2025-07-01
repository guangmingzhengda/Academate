<template>
    <div class="col" :class="{ 'col-compact': isCompact }"
         @mouseenter="hover = true"
         @mouseleave="hover = false"
         @mouseover="hover = true" @click="goto">
        <a class="linkStyle">
            <div class="button-content" :class="{ 'compact-mode': isCompact }">
                <el-icon v-if="iconName" :size="isCompact ? 24 : 18" class="button-icon" :class="{ 'icon-compact': isCompact }">
                    <component :is="iconName" />
                </el-icon>
                <div v-show="!isCompact" :class="{ customFont: true }">{{buttonName}}</div>
            </div>
        </a>
    </div>
</template>

<script>
import store from "@/store";
import {callError} from "@/call";
import { 
    House, 
    Search, 
    ChatDotRound, 
    Share, 
    User, 
    SwitchButton,
    UserFilled
} from '@element-plus/icons-vue';

export default {
    name: "navButton",
    components: {
        House,
        Search, 
        ChatDotRound,
        Share,
        User,
        SwitchButton,
        UserFilled
    },
    props: ['buttonName', 'dest', 'iconName', 'isCompact'],
    data(){
        return{
            hover: false, badgeSet: false, badgeValue: 0
        }
    },
    methods:{
        goto(){
            if(this.dest === '/logout') store.dispatch('logout');
            else if (this.dest !== 'null') this.$router.push(this.dest);
        },
    }
}
</script>

<style scoped>
.col{
    width: auto;
    min-width: 80px;
    padding: 0 15px;
    height: 70px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    border-radius: 8px;
    margin: 0 2px;
}

.col.col-compact {
    min-width: 50px;
    padding: 0 8px;
}

.col:hover{
    background-color: rgba(64, 158, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.button-content {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-direction: column;
    transition: all 0.3s ease;
}

.button-content.compact-mode {
    justify-content: center;
    gap: 0;
}

.button-icon {
    color: #409eff;
    transition: all 0.3s ease;
}

.button-icon.icon-compact {
    transform: scale(1.2);
}

.col:hover .button-icon {
    transform: scale(1.1);
    color: #1890ff;
}

.linkStyle{
    text-decoration: none;
    color: #000;
    cursor: pointer;
}

.customFont {
    font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    color: #353535;
    font-weight: 500;
    transition: color 0.3s ease;
    margin-top: 2px;
}

.col:hover .customFont {
    color: #409eff;
}
</style>
