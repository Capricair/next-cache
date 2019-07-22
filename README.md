# next-cache

This is a server side rendering cache service

## environment
node 10.15.3  
npm 6.4.1

## install
```node.js
npm install next-cache
```

## start
```
// server
const NextCache = require("next-cache");
const server = NextCache.Server({
    port: 666,
});
server.start();

// client
const NextCache = require("next-cache");
const cache = NextCache.Client("ws://localhost:666");
await cache.connect();
const data = await cache.get(`cacheKey`, async()=>{
    return await new Promise(resolve => {
        setTimeout(()=>{
            resolve({
                value: 123, // your data
                ttl: 3600,  // time to live, default is one hour
            });
        }, 1000)
    })
})
```

