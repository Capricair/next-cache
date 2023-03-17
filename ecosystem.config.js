const platform = process.platform
const NPM_PATH = {
  win32: `${process.env.NVM_SYMLINK}/node_modules/npm/bin/npm-cli.js`,
  linux: `${process.env.NVM_BIN}/../lib/node_modules/npm/bin/npm-cli.js`,
}
const npm = NPM_PATH[platform]

module.exports = {
  apps: [
    {
      name: "next-cache",
      script: "src/server/index.js",
      args: "--max-old-space-size=7500",
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: 4001,
      },
    },
  ],
}
