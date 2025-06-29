import store from '@/store'

class WebSocketManager {
    constructor() {
        this.ws = null
        this.connected = false
        this.reconnectTimer = null
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.messageHandlers = new Map() // 存储消息处理器
        this.connectionHandlers = new Map() // 存储连接状态处理器
    }

    // 注册消息处理器
    registerMessageHandler(type, handler) {
        this.messageHandlers.set(type, handler)
    }

    // 注销消息处理器
    unregisterMessageHandler(type) {
        this.messageHandlers.delete(type)
    }

    // 注册连接状态处理器
    registerConnectionHandler(id, handler) {
        this.connectionHandlers.set(id, handler)
    }

    // 注销连接状态处理器
    unregisterConnectionHandler(id) {
        this.connectionHandlers.delete(id)
    }

    // 连接WebSocket
    connect() {
        const userId = store.getters.getId
        if (!userId) {
            console.error('用户ID未找到，无法建立WebSocket连接')
            return
        }

        // 如果已经连接，直接返回
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket已连接，跳过重复连接')
            return
        }

        // 如果存在旧连接，先关闭
        if (this.ws) {
            console.log('关闭现有WebSocket连接，准备重新连接')
            this.ws.close(1000, '重新连接')
            this.ws = null
        }

        const wsUrl = `ws://123.56.50.152:8081/api/websocket/${userId}`
        console.log('正在连接WebSocket:', wsUrl)

        try {
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log('WebSocket连接成功')
                this.connected = true
                this.reconnectAttempts = 0
                this.notifyConnectionHandlers(true)
            }

            this.ws.onmessage = (event) => {
                // 先检查是否是特殊字符串消息
                if (event.data === 'true') {
                    this.handleSendSuccess()
                    return
                }
                
                if (event.data === 'conn_success') {
                    return
                }
                
                // 尝试解析JSON消息
                try {
                    const messageData = JSON.parse(event.data)
                    
                    // 根据消息类型分发处理
                    this.handleMessage(messageData)
                    
                } catch (error) {
                    // 解析WebSocket消息失败，不是JSON
                }
            }

            this.ws.onclose = (event) => {
                console.log('WebSocket连接关闭:', event.code, event.reason)
                this.connected = false
                this.notifyConnectionHandlers(false)
                
                // 非正常关闭时尝试重连
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log(`尝试重连 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
                    this.reconnectAttempts++
                    this.reconnectTimer = setTimeout(() => {
                        this.connect()
                    }, 3000 * this.reconnectAttempts) // 递增延迟重连
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket连接错误:', error)
                this.connected = false
                this.notifyConnectionHandlers(false)
            }

        } catch (error) {
            console.error('创建WebSocket连接失败:', error)
        }
    }

    // 断开WebSocket连接
    disconnect() {
        console.log('主动断开WebSocket连接')
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        
        if (this.ws) {
            this.ws.close(1000, '主动断开')
            this.ws = null
        }
        this.connected = false
        this.notifyConnectionHandlers(false)
    }

    // 发送消息
    sendMessage(messageData) {
        if (!this.connected) {
            console.error('WebSocket连接已断开，无法发送消息')
            return false
        }
        
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket连接未就绪，无法发送消息')
            return false
        }
        
        try {
            this.ws.send(JSON.stringify(messageData))
            return true
        } catch (error) {
            console.error('发送消息失败:', error)
            return false
        }
    }

    // 处理接收到的消息
    handleMessage(messageData) {
        console.log('WebSocketManager收到消息:', messageData)
        
        // 检查是否是聊天消息（type为"chat_message"）
        if (messageData.type === 'chat_message') {
            const handler = this.messageHandlers.get('chat_message')
            if (handler) {
                handler(messageData)
            }
        } else if (messageData.type && messageData.message && messageData.messageId) {
            // 其他类型的消息（消息中心的消息）
            // 首先尝试查找特定类型的处理器
            let handler = this.messageHandlers.get(messageData.type)
            
            // 如果没有特定类型的处理器，尝试使用通配符处理器
            if (!handler) {
                handler = this.messageHandlers.get('*')
            }
            
            // 如果还是没有处理器，使用默认的system_message处理器（向后兼容）
            if (!handler) {
                handler = this.messageHandlers.get('system_message')
            }
            
            if (handler) {
                handler(messageData)
            } else {
                console.log('未找到消息处理器，消息类型:', messageData.type)
            }
        } else {
            // 未知消息格式，跳过处理
            console.log('未知消息格式:', messageData)
        }
    }

    // 处理发送成功确认
    handleSendSuccess() {
        const handler = this.messageHandlers.get('send_success')
        if (handler) {
            handler()
        }
    }

    // 通知连接状态处理器
    notifyConnectionHandlers(connected) {
        this.connectionHandlers.forEach((handler) => {
            try {
                handler(connected)
            } catch (error) {
                console.error('连接状态处理器执行错误:', error)
            }
        })
    }

    // 获取连接状态
    isConnected() {
        // 检查实际的WebSocket连接状态
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.connected = true
            return true
        } else {
            this.connected = false
            return false
        }
    }

    // 获取WebSocket实例
    getWebSocket() {
        return this.ws
    }
}

// 创建单例实例
const websocketManager = new WebSocketManager()

export default websocketManager 