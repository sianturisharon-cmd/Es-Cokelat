// webpack.dev.js
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common.js");

const developmentConfig = merge(commonConfig, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: { directory: require("path").resolve(__dirname, "dist") },
    devMiddleware: { writeToDisk: true },
    historyApiFallback: true,
    hot: true,
    open: true,
    port: 9000,
    allowedHosts: "all"
  }
});

module.exports = developmentConfig;