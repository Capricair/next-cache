const TimeUnit = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
}

const ByteUnits = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB", "BB", "NB", "DB", "CB", "XB"]

const isCacheExpired = function (result) {
  return Date.now() - result.timestamp > result.ttl * TimeUnit.Second
}

const sleep = function (millisecond) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, millisecond)
  })
}

const sizeof = function (value) {
  try {
    return Buffer.from(value).length
  } catch (e) {
    return 0
  }
}

const toNumber = (str, defaultValue = null) => {
  const result = +str
  return isNaN(result) ? defaultValue : result
}

const humanize = {
  bytes: {
    stringify: (number, fractionDigits = 2) => {
      let num = number
      let i = 0
      while (num > 1) {
        if (num / 1024 < 1 || i >= ByteUnits.length - 1) break
        num = +(num / 1024).toFixed(fractionDigits)
        i++
      }
      return num + ByteUnits[i]
    },
    parse: (humanizeString) => {
      const matches = humanizeString.match(/^(\d+(\.\d+)?)\s*([a-zA-Z]+)$/) || []
      const value = toNumber(matches[1], 0)
      const unit = matches[3]?.toUpperCase()
      if (!value || !unit) throw new Error("[Humanize Bytes] parse error: invalid string")
      const index = ByteUnits.findIndex((item) => item === unit)
      if (index === -1) throw new Error("[Humanize Bytes] parse error: invalid unit")
      return Math.pow(1024, index) * value
    },
  },
}

module.exports = {
  TimeUnit,
  isCacheExpired,
  sleep,
  sizeof,
  humanize,
}
