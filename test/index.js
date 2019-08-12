const Server = require("../src/server/index");
const Client = require("../src/client/index");

(async function () {
    "use strict";
    
    const server = new Server({
        port: 666,
        accessLog: true,
    });
    await server.start();

    const client = new Client(`ws://localhost:666`);
    await client.connect();
    let cacheKey = "test_key";
    let sleep = async(millisecond)=>{
        return new Promise(resolve => {
            setTimeout(()=>{
                resolve();
            }, millisecond);
        })
    };
    let getData = async()=>{
        console.log(`update cache`);
        await sleep(3000);
        return {
            value: 123,
            ttl: 1,
        };
    };
    console.log(`get value`);
    let now = new Date();
    let value = await client.get(cacheKey, getData);
    console.log(`value is ${value}, use ${new Date() - now}ms`);
    console.log(`wait 5 seconds`);
    await sleep(5000);
    console.log(`get value 10 times`);
    now = new Date();
    let values = await Promise.all([
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
        client.get(cacheKey, getData),
    ]);
    console.log(`value is ${values}, use ${new Date() - now}ms`);
    
})();