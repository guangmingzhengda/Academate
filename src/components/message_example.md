五种类型的消息

```
    {
        id: 1,
        type: 'project_invite', // 项目邀请
        sender: '张教授',
        content: '邀请您加入"基于深度学习的智能推荐系统"项目，该项目将持续12个月，主要研究推荐算法优化。',
        time: new Date(Date.now() - 15 * 60 * 1000), // 15分钟前
        avatar: require('@/asset/home/user.png'),
        read: false,
        projectId: 101,
        status: null // null: 未处理, 'accepted': 已同意, 'rejected': 已拒绝
    },
    {
        id: 2,
        type: 'project_apply', // 项目申请
        sender: '李研究员',
        content: '申请加入您负责的"人工智能在教育领域的应用研究"项目，我在机器学习和教育技术方面有丰富经验。',
        time: new Date(Date.now() - 45 * 60 * 1000), // 45分钟前
        avatar: require('@/asset/home/user.png'),
        read: false,
        projectId: 102,
        status: null
    },
    {
        id: 3,
        type: 'researcher_update', // 研究人员状态更新
        sender: '王博士',
        content: '更新了个人研究状态：刚刚完成了关于"量子计算在密码学中的应用"的最新研究论文，正在寻求合作伙伴进行进一步验证。',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        avatar: require('@/asset/home/user.png'),
        read: true
    },
    {
        id: 4,
        type: 'data_request', // 数据/全文请求
        sender: '陈院士',
        content: '希望获取您论文《深度学习算法优化研究》的完整数据集和实验代码，用于我们团队的相关研究对比分析。',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
        avatar: require('@/asset/home/user.png'),
        read: false,
        paperId: 203,
        status: null
    },
    {
        id: 5,
        type: 'question_reply', // 问题回复提醒
        sender: '刘教授',
        content: '回复了您关注的问题"如何提高神经网络的训练效率？"：建议使用批量归一化和学习率调度策略，具体可以参考我最近的研究成果...',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
        avatar: require('@/asset/home/user.png'),
        read: true,
        questionId: 304
    }
```


Websocket 返回示例：

```
// 项目邀请
{
    "message": "用户7777777向您发送加入项目：test websocket的邀请",
    "messageId": 14,
    "projectId": 6,
    "receiverId": 7,
    "senderId": 1,
    "sentAt": 1750732968519,
    "status": "processed"
}
```