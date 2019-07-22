const WebSocket = require("ws");
const uuid = require("uuid/v4");
const {TimeUnit, isCacheExpired} = require("../utils/index");

function Socket(url, options) {
    const _default = {
        retry: 5,
        timeout: 30000,
        ws: {
            perMessageDeflate: true,  //启用数据压缩
        },
    };
    const conf = Object.assign({}, _default, options);
    const getUniqueId = function () {
        return uuid();
    };
    
    let ws = {};
    let queue = {};

    this.isConnected = false;

    this.connect = ()=>{
        let retryCount = 1;
        return new Promise(resolve => {
            try {
                if (ws.terminate){
                    ws.terminate();
                }

                ws = new WebSocket(url, conf.ws);

                ws.on("open", ()=>{
                    this.isConnected = true;
                    console.log(`server is connected!`);
                    resolve();
                });

                ws.on("message", (data)=>{
                    try {
                        let result = JSON.parse(data);
                        let callback = queue[result.id];
                        if (typeof callback === "function"){
                            callback(result.data);
                        }
                        delete queue[result.id];
                    } catch (e) {
                        console.log(e);
                    }
                });

                ws.on("error", (e)=>{
                    console.error(e);
                });

                ws.on("close", ()=>{
                    // 如果isConnected是true说明是连上之后意外情况导致的连接中断
                    if (this.isConnected === true){
                        console.log(`connection is closed, retry ${retryCount++}`);
                        console.log(`reconnecting...`);
                        this.connect(url);
                    }
                });
            } catch (e) {
                console.error(e);
            }
        })
    };
    
    this.send = (data, callback)=>{
        try {
            if (ws.readyState === WebSocket.OPEN){
                let id = getUniqueId();
                queue[id] = callback;
                ws.send(JSON.stringify({
                    id: id,
                    data: data,
                }));
                setTimeout(()=>{
                    if (queue[id]){
                        queue[id](null);
                        delete queue[id];
                    }
                }, conf.timeout);
            } else {
                console.error(`server is disconnected!`);
            }
        } catch (e) {
            console.error(e);
        }
    };
}


function Client(url, options) {
    let _default = {
        client: {
            ttl: 3600,
        },
        socket: {
            ws: {},
        },
    };
    let conf = Object.assign({}, _default, options);
    let socket = new Socket(url, conf.socket);
    let lock = {};
    
    this.connect = async () => {
        if (socket.readyState !== WebSocket.OPEN){
            await socket.connect(url);
        } else {
            console.log(`server is already connected!`);
        }
        return Promise.resolve(this);
    };
    
    this.get = (key, getData) => {
        return new Promise(resolve => {
            socket.send({
                action: "get",
                key: key,
            }, async(result)=>{
                try {
                    if (!result.value || (isCacheExpired(result) && typeof getData === "function" && !lock[key])){
                        lock[key] = true;
                        result = await getData();
                        if ("ttl" in result === false){
                            result = {value: result, ttl: conf.client.ttl};
                        }
                        await this.set(key, result.value, result.ttl);
                    }
                } finally {
                    delete lock[key];
                    resolve(result.value);
                }
            });
        });
    };

    this.set = (key, value, ttl) => {
        return new Promise(resolve => {
            socket.send({
                action: "set",
                key: key,
                value: value,
                ttl: ttl || conf.client.ttl,
            }, resolve);
        });
    };
}

module.exports = Client;