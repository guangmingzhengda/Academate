<template>
    <div class="stats">
        <div class="stat">
            <div style="font-size: 20px">阅读量</div>
            <div :style="{ color: getColor(visitCount), fontSize: '18px' }">{{ formatNumber(visitCount) }}</div>
        </div>
        <div class="stat">
            <div style="font-size: 20px">评论数</div>
            <div :style="{ color: getColor(comments), fontSize: '18px' }">{{ formatNumber(comments) }}</div>
        </div>
        <div class="stat">
            <div style="font-size: 20px">收藏数</div>
            <div :style="{ color: getColor(favorites), fontSize: '18px' }">{{ formatNumber(favorites) }}</div>
        </div>
    </div>
    <hr>
    <!-- <div class="field-list">
        <p class="small-title">相关领域</p>
        <div v-if="work.relatedSubfieldList.length === 0" style="margin: 5px 0;text-align: left;font-size: 16px;">
            未划分领域
        </div>
        <div v-for="field in work.relatedSubfieldList" :key="field" class="field" @click="goToField(field)">
            - {{ field }}
        </div>
    </div>
    <hr>
    <div class="field-list">
        <p class="small-title">相关文章</p>
        <div v-if="work.relatedWorkList.length === 0" style="margin: 5px 0;text-align: left;font-size: 16px;">
            无相关文章
        </div>
        <div v-for="article in work.relatedWorkList" :key="article.name" class="field" @click="goToAchievement(article.id)">
            - {{ modifyTitle(article.name) }}
        </div>
    </div> -->

</template>

<script lang="js">
import {getAllCommentsAPI, getStarSum} from "@/page/achievement-detail/api/api";
import {ref} from "vue";
import {decode_function} from "@/decode/code";

export default {
    name: "side-component",
    props: {
        work: {
            id: 1,
        }
    },
    data() {
        return {
            comments: ref(0),
            favorites: ref(0),
            visitCount: ref(0),
        }
    },
    async mounted() {
        const commentData = await getAllCommentsAPI(decode_function(this.$route.params.id), 4, 1);
        this.comments = commentData.total;
        this.favorites = await getStarSum(decode_function(this.$route.params.id));
        setTimeout(()=>{
            this.visitCount = this.work.visitCount;
        }, 200);
    },
    methods: {
        getColor(value) {
            if (value < 10) {
                return '#4994c4';
            }
            if(value < 1000) {
                return '#003d74';
            }
            else {
                return '#2e59a7';
            }
        },
        formatNumber(value) {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + ' M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + ' K';
            } else {
                return value.toString();
            }
        },
        goToField(fieldName) {
            let mp = {
                'article': 0,
                'patent': 1,
                'project': 2,
                'award': 3
            }
            window.open(`/search/null/${mp[this.work.type]}/${fieldName}`,'_self');
        },
        goToAchievement(id) {
            window.open("/achievement-detail/"+id,'_self');
        }
    },
    setup() {
        function modifyTitle(s) {
            return s.replace(/\(<i>.*?<\/i>\)/g, '').replace(/<scp>.*?<\/scp>/g, '');
        }
        return {
            modifyTitle,
        }
    }
}
</script>

<style scoped>
.stats {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 100px;
    padding: 10px;
    box-sizing: border-box;
    margin-top: 10px;
    align-items: center;
}
.stat {
    text-align: center;
    line-height: 1.5;
    padding: 5px;
    box-sizing: border-box;
}
.small-title {
    text-align: left;
    font-weight: bold;
    font-size: 20px;
}
.field-list {
    padding: 5px;
}
.field {
    margin: 5px 0;
    cursor: pointer;
    text-align: left;
    font-size: 16px;
    color: #6e9bc5;
    transition: color 0.3s;
}
.field:hover {
    color: #106898;
}
hr {
    border: 0;
    height: 1px;
    background: #ccc;
    margin: 20px 0;
}

</style>
