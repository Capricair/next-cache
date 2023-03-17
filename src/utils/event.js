const Events = []

class EventEmitterClass {
  addEventListener(name, handler, id = Math.random().toString().substring(2)) {
    Events.push({ name, handler, id })
  }

  removeEventListener(name, handler) {
    let arr
    if (typeof handler === "string") {
      arr = Events.filter((item) => !(item.name === name && item.id === handler))
    } else {
      arr = Events.filter((item) => !(item.name === name && item.handler === handler))
    }
    Events.length = 0
    Events.push(...arr)
  }

  async dispatchEvent(name, ...args) {
    const events = Events.filter((item) => item.name === name)
    await Promise.allSettled(events.map((item) => item.handler?.(...args)))
  }
}

const EventEmitter = new EventEmitterClass()

module.exports = EventEmitter
