<template>
</template>

<script>

import {canUseAI} from "@/api/ai";
import store from "@/store";
import {callError, callInfo} from "@/call";

let selectedText = "";
document.addEventListener('mouseup', function() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        if(selection.toString())
          selectedText = selection.toString();
        // console.log("当前选中的内容: ", selectedText);
    }
});
export default {
    name: 'testAI',

    mounted() {
        this.initializeChatbot();
    },
    methods: {
        initializeChatbot() {
            const setPageSummarizeButton = (disabled) => {
                const button = document.querySelector('.webChat-footer-extra-button');
                if (button) {
                    button.disabled = disabled;
                }
            };

            const button = document.createElement('button');
            button.className = 'webChat-footer-extra-button';
            button.textContent = '页面总结';


            button.addEventListener('click', () => {
                // console.log('页面总结按钮被点击');
            });

            const defaultPrompt = '总结当前页面内容';
            // const summaryAbstract = '总结摘要';
            const interpretSelected = '解读选中内容';
            window.CHATBOT_CONFIG = {
                endpoint: 'https://summaritant-syz-yudpybjtvo.cn-hangzhou.fcapp.run/chat',
                feedBackConfig: {
                    like: {
                        hide: false,
                        onClick: () => {
                        }
                    },
                    disLike: {
                        hide: false,
                        onClick: () => {
                        }
                    }
                },
                dataProcessor: {
                    rewritePrompt(prompt) {
                        if (prompt === defaultPrompt) {
                            // 获取当前页面的所有文本内容
                            const pageContent = this.getPageContent();
                            return `请使用中文总结以下整个网页内容：\n\n------\n\n${pageContent}`;
                        }
                        // else if(prompt === summaryAbstract) {
                        //     const abstractContent = this.getAbstract();
                        //     return `请使用中文总结以下摘要内容：\n\n------\n\n${abstractContent}`;
                        // }
                        else if(prompt === interpretSelected) {
                            return `请使用中文解读以下内容：\n\n------\n\n${selectedText}`;
                        }
                        return prompt;
                    },

                    getPageContent() {
                        const tempDiv = document.createElement('div');
                        tempDiv.appendChild(document.body.cloneNode(true));

                        const scripts = tempDiv.querySelectorAll('script, style, noscript, iframe, img, video, audio');
                        scripts.forEach(script => script.remove());
                        return tempDiv.textContent.trim();
                    },
                    // getAbstract() {
                    //     const divElement = document.getElementById("abstract");
                    //     return divElement.innerText;
                    // }
                },
                aiChatOptions: {
                    className: 'summarize-ai-chat',
                    personaOptions: {
                        assistant: {
                            avatar: 'https://help-static-aliyun-doc.aliyuncs.com/demos/ai-assistant-logo.gif',
                        },
                        user: {
                            avatar: 'https://oss.aliyuncs.com/aliyun_id_photo_bucket/default_handsome.jpg',
                        }
                    },
                    composerOptions: {
                        placeholder: '请将您遇到的问题告诉我',
                        hideStopButton: true
                    },
                    events: {
                        messageSent: () => {
                            setPageSummarizeButton(true);
                        },
                        messageReceived: () => {
                            setPageSummarizeButton(false);
                        }
                    },
                    conversationOptions: {
                        conversationStarters: [
                            { prompt: defaultPrompt },
                            // { prompt: summaryAbstract },
                            { prompt: interpretSelected },
                        ],
                        layout: 'list',
                    },
                },
                customRenderOptions: {
                    greetingOptions: {
                        greeting: '你好, 我是',
                        name: 'AI助手',
                        quickStartItemClick: async ({api, item}) => {
                            api?.composer && api.composer.send(item?.prompt);

                            const ok = await canUseAI();
                            // console.log("can use " + ok);
                            if (!ok) {
                                if (!store.getters.getVipState)
                                    callInfo("非vip每24h至多使用10次");
                                else
                                    callInfo("vip每24h至多使用50次");
                                setTimeout(() => {
                                    location.reload();
                                }, 1500)
                            }
                        }
                    },
                    onInit: (params) => {
                        const { api } = params || {};

                        const extraButton = document.querySelector('.webChat-footer-extra');
                        const footer = document.querySelector('.nlux-composer-container');
                        if (!footer || extraButton) return;
                        const footerParent = footer.parentElement;

                        const newDiv = document.createElement('div');
                        newDiv.className = 'webChat-footer-extra';



                        footerParent && footerParent.insertBefore(newDiv, footer);

                        const title = document.querySelector('.webchat-container-toolbar span');
                        if (title) {
                            title.innerHTML = 'AI助手';
                        }
                    },
                    stopButtonClass: 'summarize-stop-button',
                    onChatbotRefresh: () => {
                        setPageSummarizeButton(false);
                    }
                }
            };

            // 加载外部资源
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.crossOrigin = 'anonymous';
            link.href = 'https://g.alicdn.com/aliyun-documentation/web-chatbot-ui/0.0.19/index.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';
            script.src = 'https://g.alicdn.com/aliyun-documentation/web-chatbot-ui/0.0.19/index.js';
            document.head.appendChild(script);
        }
    }
};
</script>

<style scoped>
/* 你可以在这里添加一些自定义样式 */
/* AI总结助手打开的对话窗口顶部标题栏样式设置 */
:root {
    --webchat-toolbar-background-color: #fff;
    --webchat-toolbar-text-color: #333;
}
/* AI总结助手打开的对话窗口如果被遮挡或需调整显示位置，可以尝试调整以下 z-index、bottom、right等属性 */
.webchat-container {
    z-index: 100;
    bottom: 10px;
    right: 10px;
}
/* AI总结助手的唤起图标如果被遮挡或需调整显示位置，可以尝试调整以下 z-index、bottom、right等属性 */
.webchat-bubble-tip {
    z-index: 99;
    bottom: 20px;
    right: 20px;
}

/* AI 对话框顶部渐变色 */
.webchat-container-toolbar {
    border-bottom: none !important;
    &::before {
        content: "";
        border-style: solid;
        border-width: 5px 0 0;
        border-image: linear-gradient(270deg, #eb8698, #1366ec) 1;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }
}
.summarize-ai-chat {
    /* 调整内容区域高度 */
    .nlux-launchPad-container,
    .nlux-conversation-container {
        height: calc(100% - 120px) !important;
    }
    /* 底部消息框布局调整 */
    .nlux-composer-container {
        box-sizing: content-box;
        width: unset !important;
        padding: 6px 16px 16px;
        border-top: none !important;
        & > div {
            border: 1px solid #DEE0E5;
            border-radius: 2px;
        }
    }
    /* 消息列表布局调整-list展示调整 */
    .nlux-comp-chatItem.nlux-comp-chatItem--listLayout {
        flex-direction: row !important;
        .nlux-comp-chatItem-participantName {
            display: none;
        }
        .nlux-comp-message.nlux_msg_sent,
        .nlux-comp-message.nlux_msg_received {
            margin-left: 0 !important;
        }
    }
    .nlux-comp-chatItem.nlux-comp-chatItem--sent.nlux-comp-chatItem--listLayout {
        margin-bottom: 1.5em;
        .nlux-comp-message.nlux_msg_sent {
            background-color: #e5effe;
            justify-content: center;
            padding: 10px;
            flex: unset !important;
        }
    }
    /* 页面总结按钮 */
    .webChat-footer-extra {
        height: 30px;
        padding-left: 16px;
        .webChat-footer-extra-button {
            display: inline-block;
            padding: 4px;
            font-size: 12px;
            border: 1px solid #DEE0E5;
            border-radius: 2px;
            background-color: #fff;
        }
        .webChat-footer-extra-button:hover {
            cursor: pointer;
            background: linear-gradient(61deg, rgba(229, 239, 254, .5) -24%, rgba(238, 235, 255, .5) 127%);
        }
        .webChat-footer-extra-button[disabled] {
            background-color: #ececec;
            cursor: not-allowed;
            opacity: 0.4;
        }
    }
    /* 发送按钮样式 */
    .nlux-comp-sendIcon {
        max-width: 28px !important;
        width: 28px;
        height: 28px;
        line-height: 28px;
        border-radius: 2px;
        background-color: #1366ec;
    }
    .nlux-comp-composer>button>.nlux-comp-sendIcon>.nlux-comp-sendIcon-container {
        mask: unset !important;
        background-color: unset;
        background-image: url('https://img.alicdn.com/imgextra/i3/O1CN01ZGAB0T1u6YYQ2sR8b_!!6000000005988-55-tps-13-13.svg');
        background-size: 12px;
        background-position: center;
    }
    .nlux-comp-composer>button[disabled]>.nlux-comp-sendIcon {
        opacity: 0.4;
    }
}
/* 终止按钮 */
.summarize-stop-button {
    bottom: 18px !important;
    right: 16px !important;
}

</style>
