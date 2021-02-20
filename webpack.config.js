const path = require("path");
const WorkerPlugin = require("worker-plugin");

module.exports = {
  entry: path.join(__dirname, "/terminal/index.js"),
  output: {
    filename: "[name].bundle.js",
    globalObject: "self",
    path: path.join(__dirname, "/build/"),
    publicPath: "/terminal/build/",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "usage",
                  corejs: "3",
                  modules: false,
                  targets: {
                    browsers: ["last 2 versions", "ie >= 9"],
                  },
                },
              ],
              "@babel/preset-react",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|woff|woff2|eot|ttf|svg|ico)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 90000,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    compress: true,
    historyApiFallback: {
      rewrites: [{ from: /\/terminal\/[^?]/, to: '/404.html' }]
    },
    disableHostCheck: true,
  },
  plugins: [
    new WorkerPlugin(),
  ],
};
