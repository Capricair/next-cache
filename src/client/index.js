const WebSocket = require("ws")
const { v4: uuid } = require("uuid")
const { isCacheExpired, sleep } = require("../utils")
const EventEmitter = require("../utils/event")

function Socket(url, options) {
  "use strict"

  const defaults = {
    retry: 5,
    timeout: 30000,
    ws: {
      perMessageDeflate: false,
    },
  }
  const conf = Object.assign({}, defaults, options)

  let ws = {}
  let isConnectSuccess = false
  let isConnected = false
  Object.defineProperties(this, {
    isConnected: {
      configurable: false,
      get: () => {
        return isConnected
      },
    },
  })

  const queue = {}
  const getUniqueId = function () {
    return uuid()
  }
  const response = function (id, data) {
    const callback = queue[id]
    if (callback) {
      delete queue[id]
      if (typeof callback === "function") {
        callback(data)
      }
    }
  }

  this.connect = () => {
    return new Promise((resolve) => {
      try {
        if (ws.terminate) {
          ws.terminate()
        }

        ws = new WebSocket(url, conf.ws)

        ws.on("open", () => {
          isConnectSuccess = true
          isConnected = true
          console.log(`server is connected!`)
          resolve(true)
        })

        ws.on("message", (data) => {
          try {
            let result = JSON.parse(data)
            response(result.id, result.data)
          } catch (e) {
            console.error(e)
          }
        })

        ws.on("error", (e) => {
          console.error(e)
          resolve(false)
        })

        ws.on("close", async () => {
          isConnected = false
          console.log(`connection is closed!`)
          // 连接成功后意外情况导致的连接中断才需要自动重连
          if (isConnectSuccess === true) {
            console.log(`reconnecting...`)
            await this.connect(url)
          }
        })
      } catch (e) {
        console.error(e)
        resolve(false)
      }
    })
  }

  this.send = (data, callback) => {
    const id = getUniqueId()
    queue[id] = callback
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            id: id,
            data: data,
          })
        )
        setTimeout(() => {
          response(id, null)
        }, conf.timeout)
      } else {
        console.error(`server is disconnected!`)
        response(id, null)
      }
    } catch (e) {
      console.error(e)
      response(id, null)
    }
  }
}

function Client(url, options) {
  "use strict"

  const defaults = {
    client: {
      ttl: 3600,
    },
    socket: {
      ws: {},
    },
  }
  const conf = Object.assign({}, defaults, options)
  const lock = {}

  let socket = new Socket(url, conf.socket)

  Object.defineProperties(this, {
    isConnected: {
      configurable: false,
      get: () => {
        return socket.isConnected
      },
    },
  })

  this.connect = async () => {
    try {
      if (socket.readyState !== WebSocket.OPEN) {
        await socket.connect(url)
      } else {
        console.log(`server is already connected!`)
      }
      return true
    } catch (e) {
      return e
    }
  }

  this.get = ({ key, getValue, ttl, onGetValue, onCacheHit }) => {
    const eventName = `cache_${key}_on_response`
    return new Promise((resolve, reject) => {
      socket.send(
        {
          action: "get",
          key: key,
        },
        async (result) => {
          try {
            if ((!result?.value || isCacheExpired(result)) && typeof getValue === "function" && !lock[key]) {
              lock[key] = true
              const value = await getValue()
              onGetValue?.({ key, value })
              await this.set({ key, value, ttl })
              await EventEmitter.dispatchEvent(eventName, { value })
              resolve(value)
            } else {
              const value = await new Promise((resolve1) => {
                const handleResponse = ({ value }) => {
                  EventEmitter.removeEventListener(eventName, handleResponse)
                  resolve1(value)
                }
                EventEmitter.addEventListener(eventName, handleResponse)
              })
              onCacheHit?.({ key, value })
              resolve(value)
            }
          } catch (e) {
            console.error(e)
            resolve(result?.value)
          } finally {
            await sleep()
            delete lock[key]
          }
        }
      )
    })
  }

  this.set = ({ key, value, ttl }) => {
    return new Promise((resolve) => {
      socket.send(
        {
          action: "set",
          key: key,
          value: value,
          ttl: ttl || conf.client.ttl,
        },
        resolve
      )
    })
  }

  this.remove = (key) => {
    return new Promise((resolve) => {
      socket.send(
        {
          action: "remove",
          key: key,
        },
        resolve
      )
    })
  }

  this.clear = () => {
    return new Promise((resolve) => {
      socket.send(
        {
          action: "clear",
        },
        resolve
      )
    })
  }
}

module.exports = Client
