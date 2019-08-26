const Server = require("../src/server/index");
const Client = require("../src/client/index");

(async function () {
    "use strict";
    
    console.log(Buffer.from(({a:1}).valueOf()).length);
    
    // const server = new Server({
    //     port: 666
    // });
    // await server.start();
    //
    // const cache = new Client(`ws://localhost:666`);
    // await cache.connect();
    //
    // function sleep(ms) {
    //     return new Promise(resolve => {
    //         setTimeout(resolve, ms)
    //     })
    // }
    //
    // // 模拟取数据的操作
    // async function getValue() {
    //     console.log(`get value`);
    //     await sleep(1000);
    //     return `your value 2`;
    // }
    //
    // async function test1() {
    //     console.log(`test 1 start`);
    //     await cache.set("cache_key1", "your value", 3);
    //     await sleep(5 * 1000);
    //     for (let i=0; i<10; i++){
    //         (async function () {
    //             let value = await cache.get("cache_key");
    //             if (!value){
    //                 value = await getValue();
    //                 cache.set("cache_key1", value, 3600);
    //             }
    //             console.log(value);
    //         })();
    //     }
    // }
    //
    // async function test2(){
    //     console.log(`test 2 start`);
    //     await cache.set("cache_key2", "your value", 3);
    //     await sleep(5 * 1000);
    //     for (let i=0; i<10; i++){
    //         cache.get("cache_key2", getValue).then((value)=>{
    //             console.log(value);
    //         });
    //     }
    // }
    //
    // // await test1();
    // await test2();
    
})();