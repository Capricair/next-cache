const { Server, Client } = require("../index")

async function main() {
  "use strict"

  const server = new Server({
    port: 666,
  })
  await server.start()

  const cache = new Client(`ws://localhost:666`)
  await cache.connect()

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  // 模拟取数据的操作
  async function getValue() {
    await sleep(1000)
    return `your value 2`
  }

  async function test2() {
    console.log(`test 2 start`)
    for (let i = 0; i < 10; i++) {
      cache
        .get({
          key: "cache_key2",
          getValue,
          onGetValue() {
            console.log("get value")
          },
          onCacheHit() {
            console.log("cache hit")
          },
        })
        .then((value) => {
          // console.log(value)
        })
    }
  }

  await test2()
}

main()
