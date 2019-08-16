const Server = require("../src/server/index");
const Client = require("../src/client/index");

(async function () {
    "use strict";

    const server = new Server({
        port: 666
    });
    await server.start();

    const cache = new Client(`ws://localhost:666`);
    await cache.connect();

    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }
    
    // 模拟取数据的操作
    async function getValue() {
        console.log(`get value`);
        await sleep(1000);
        return `your value 2`;
    }

    // async function test() {
    //     await cache.set("cache_key", "your value", 3);
    //     await sleep(5 * 1000);
    //     let value = await cache.get("cache_key");
    //     if (!value){
    //         value = await getValue();
    //         cache.set("cache_key", value, 3600);
    //     }
    // }
    
    await cache.set("cache_key", `your value 1`, 3);
    await sleep(5 * 1000);
    let tasks = [];
    for (let i=0; i<10; i++){
        tasks.push(cache.get("cache_key", getValue));
    }
    let values = await Promise.all(tasks);
    console.log(values);
    
    let value = await cache.get(`cache_key`, getValue);
    console.log(value);
    
})();