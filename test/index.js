const Server = require("../src/server/index");
const Client = require("../src/client/index");

(async function () {
    "use strict";

    const server = new Server({
        port: 666,
    });
    await server.start();
    
    const client = new Client(`http://localhost:666`);
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
            duration: 1,
        };
    };
    let value = await client.get(cacheKey, getData);
    await sleep(5000);
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
    value = values[9];
    
    console.log(value);
    
})();