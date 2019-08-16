const WebSocket = require("ws");
const uuid = require("uuid/v4");
const {TimeUnit, isCacheExpired} = require("../utils/index");

function Socket(url, options) {
    "use strict";
    
    const defaults = {
        retry: 5,
        timeout: 30000,
        ws: {
            perMessageDeflate: true,  //启用数据压缩
        },
    };
    const conf = Object.assign({}, defaults, options);

    let ws = {};
    let isConnectSuccess = false;
    let isConnected = false;
    Object.defineProperties(this, {
        isConnected: {
            configurable: false,
            get: ()=>{
                return isConnected;
            }
        }
    });
    
    const queue = {};
    const getUniqueId = function () {
        return uuid();
    };
    const response = function (id, data) {
        const callback = queue[id];
        if (callback){
            if (typeof callback === "function"){
                callback(data);
            }
            delete queue[id];
        }
    };
    
    this.connect = ()=>{
        return new Promise((resolve) => {
            try {
                if (ws.terminate){
                    ws.terminate();
                }

                ws = new WebSocket(url, conf.ws);

                ws.on("open", ()=>{
                    isConnectSuccess = true;
                    isConnected = true;
                    console.log(`server is connected!`);
                    resolve(true);
                });

                ws.on("message", (data)=>{
                    try {
                        let result = JSON.parse(data);
                        response(result.id, result.data);
                    } catch (e) {
                        console.error(e);
                    }
                });

                ws.on("error", (e)=>{
                    console.error(e);
                    resolve(false);
                });

                ws.on("close", ()=>{
                    isConnected = false;
                    console.log(`connection is closed!`);
                    // 连接成功后意外情况导致的连接中断才需要自动重连
                    if (isConnectSuccess === true){
                        console.log(`reconnecting...`);
                        this.connect(url);
                    }
                });
            } catch (e) {
                console.error(e);
                resolve(false);
            }
        })
    };
    
    this.send = (data, callback)=>{
        const id = getUniqueId();
        queue[id] = callback;
        try {
            if (ws.readyState === WebSocket.OPEN){
                ws.send(JSON.stringify({
                    id: id,
                    data: data,
                }));
                setTimeout(()=>{
                    response(id, null);
                }, conf.timeout);
            } else {
                console.error(`server is disconnected!`);
                response(id, null)
            }
        } catch (e) {
            console.error(e);
            response(id, null);
        }
    };
}


function Client(url, options) {
    "use strict";
    
    const defaults = {
        client: {
            ttl: 3600,
        },
        socket: {
            ws: {},
        },
    };
    const conf = Object.assign({}, defaults, options);
    const lock = {};
    
    let socket = new Socket(url, conf.socket);

    Object.defineProperties(this, {
        isConnected: {
            configurable: false,
            get: ()=>{
                return socket.isConnected;
            }
        }
    });
    
    this.connect = async () => {
        try {
            if (socket.readyState !== WebSocket.OPEN){
                await socket.connect(url);
            } else {
                console.log(`server is already connected!`);
            }
            return true;
        } catch (e) {
            return e;
        }
    };
    
    this.get = (key, getValue) => {
        return new Promise(resolve => {
            socket.send({
                action: "get",
                key: key,
            }, async(result)=>{
                try {
                    if (!result.value || (isCacheExpired(result) && typeof getValue === "function" && !lock[key])){
                        lock[key] = true;
                        result = await getValue();
                        if (typeof result !== "object" || "ttl" in result === false){
                            result = {value: result, ttl: conf.client.ttl};
                        }
                        await this.set(key, result.value, result.ttl);
                        delete lock[key];
                    }
                } catch (e) {
                    delete lock[key];
                } finally {
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