const WebSocket = require("ws");
const {TimeUnit} = require("../utils/index");

function Cache(options) {
    const defaults = {
        localStorage: null,
        accessLog: false,
        removeDelay: 60,
    };
    const conf = Object.assign({}, defaults, options);
    const timeoutIds = {};
    const localStorage = conf.localStorage || {
        cache: {},
        getItem(key){
            return this.cache[key];
        },
        setItem(key, value){
            this.cache[key] = value;
        },
        removeItem(key){
            delete this.cache[key];
        }
    };
    const storage = {
        get: (key, dataType="json")=>{
            let data = localStorage.getItem(key);
            return dataType === "json" ? JSON.parse(data || `null`) : data;
        },
        set: (key, value)=>{
            if (typeof value !== "string") {
                value = JSON.stringify(value);
            }
            localStorage.setItem(key, value);
        },
        remove: (key)=>{
            localStorage.removeItem(key);
        }
    };
    this.get = (key, dataType)=>{
        if (conf.accessLog){
            console.log(`get cache ${key}`);
        }
        let result = storage.get(key, dataType || "json") || {};
        if (new Date() - result.timestamp > result.ttl * TimeUnit.Second + conf.removeDelay * TimeUnit.Second){
            storage.remove(key);
            return null;
        }
        return result;
    };
    this.set = (key, value, ttl)=>{
        if (conf.accessLog){
            console.log(`set cache ${key}`);
        }
        storage.set(key, {
            value: value,
            timestamp: new Date().getTime(),
            ttl: ttl,
        });
        // 清除上一个setTimeout，否则同一个key多次set，第一个setTimeout会提前删除缓存，同一个key应以最后一次为准
        clearTimeout(timeoutIds[key]);
        // 超过缓存过期时间后删除缓存，默认缓存时间延迟一分钟删除，因为高并发场景需要脏数据
        timeoutIds[key] = setTimeout(()=>{
            storage.remove(key);
        }, ttl * TimeUnit.Second + conf.removeDelay * TimeUnit.Second);
    };
    this.remove = (key)=>{
        storage.remove(key);
    };
}

function Server(options) {
    "use strict";
    
    const defaults = {
        port: process.env.PORT || 666,
        verifyClient: () => true,
        removeDelay: 60,
        accessLog: false,
    };
    const conf = Object.assign({}, defaults, options);
    const cache = new Cache(conf);
    
    function sendTo(client, data) {
        try {
            if (typeof data !== "string"){
                data = JSON.stringify(data);
            }
            client.send(data);
        } catch (e) {
            console.error(e);
        }
    }
    
    this.start = function () {
        return new Promise(resolve => {
            let WebSocketServer = new WebSocket.Server({
                port: conf.port,
                verifyClient: conf.verifyClient,
            });

            WebSocketServer.on("connection", function (client, request) {
                client.isAlive = true;
                client.on("pong", function () {
                    client.isAlive = true;
                });

                client.on("message", function (message) {
                    try {
                        let {id, data} = JSON.parse(message);
                        if (data.action === "get"){
                            let result = cache.get(data.key);
                            sendTo(client, {
                                id: id,
                                data: result,
                            });
                        } else if (data.action === "set") {
                            cache.set(data.key, data.value, data.ttl);
                            sendTo(client, {
                                id: id,
                                success: true,
                                message: `set cache ${data.key} success!`
                            });
                        }
                    } catch (e) {
                        console.error("incoming data: ", data, "error: ", e);
                    }
                });
            });

            setInterval(function () {
                WebSocketServer.clients.forEach(function (client) {
                    if (client.isAlive === false) {
                        return client.terminate();
                    }
                    client.isAlive = false;
                    client.ping(function () {});
                });
            }, 60 * 1000);

            WebSocketServer.on("listening", function () {
                console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
                console.log(`WebSocket server is listening at ${conf.port}`);
                resolve();
            });
        });
    };
}

module.exports = Server;