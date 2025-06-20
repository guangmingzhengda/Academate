const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack');
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css', 'png', '.ttf']

module.exports = defineConfig({

  pages: {
    index: {
      entry:'src/main.ts',
    },
  },

  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    port: 5653,
    proxy: {

      '/api': {
        target: 'http://121.36.57.109:30080',
        changeOrigin: true,
        pathRewrite: {
          "^/api": "/api"
        }
      },
      '/postFile': {
        target: 'https://chkbigevent.oss-cn-beijing.aliyuncs.com',
        changeOrigin: true,
        pathRewrite: {
          "^/postFile": ""
        }
      }
    },
    // 解决el-table自适应窗口大小时webpack报错的问题（其实就是不让这个报错显示
    client: {
      overlay: false
    },
  },
  configureWebpack: {

    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: true
          },
          exclude: /node_modules/
        }
      ]
    },

    optimization: {
      minimize: true // 禁用代码压缩
    },

    plugins: [
      new CompressionWebpackPlugin({
          filename: '[path][base].gz', // 提示 compression-webpack-plugin@3.0.0的话asset改为filename
          algorithm: 'gzip',
          test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
          threshold: 10240,
          minRatio: 0.8
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 5,
      })
    ],
    performance: {
      // hints: false,
      maxEntrypointSize: 1024000,
      maxAssetSize: 1024000,
    },
  }
})
