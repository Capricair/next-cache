const Server = require("../src/server/index");
const Client = require("../src/client/index");

(async function () {
    "use strict";

    function Dog() {
        this.name = "dog";
    }
    
    function Cat() {
        this.name = "cat";
        Dog.apply(this);
    }
    
    
    // const server = new Server({
    //     port: 666,
    //     accessLog: true,
    // });
    // await server.start();
    //
    // const client = new Client(`ws://localhost:666`);
    // await client.connect();
    // let cacheKey = "test_key";
    // let sleep = async(millisecond)=>{
    //     return new Promise(resolve => {
    //         setTimeout(()=>{
    //             resolve();
    //         }, millisecond);
    //     })
    // };
    // let getData = async()=>{
    //     console.log(`update cache`);
    //     await sleep(3000);
    //     return {
    //         value: 123,
    //         ttl: 1,
    //     };
    // };
    // let value = await client.get(cacheKey, getData);
    // await sleep(5000);
    // let values = await Promise.all([
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    //     client.get(cacheKey, getData),
    // ]);
    //
    // console.log(value, values);
    
})();