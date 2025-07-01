const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      renderer: './src/renderer.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'renderer.js',
      clean: true,
    },
    target: 'electron-renderer',
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
              sourceType: 'unambiguous',
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@agents': path.resolve(__dirname, 'src/agents'),
      },
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist/renderer'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
    },
    optimization: {
      splitChunks: false,
    },
  };
};
