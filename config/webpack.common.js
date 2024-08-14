const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const sharp = require('sharp');
const fs = require('fs').promises;

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              ['@babel/plugin-transform-react-jsx', { pragma: 'h' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.png$/,
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: async (imagePath) => {
                const sharpImage = sharp(imagePath);
                const metadata = await sharpImage.metadata();
                const hasAlpha = metadata.channels === 4;

                const sizes = [300, 600, 1200, 2000];
                const formats = ['webp'];
                if (hasAlpha) {
                  formats.push('png');
                } else {
                  formats.push('jpg');
                }

                for (const format of formats) {
                  for (const size of sizes) {
                    const resizedImage = sharpImage.clone().resize(size);
                    const outputPath = path.join(
                      __dirname,
                      '../dist',
                      'assets',
                      'images',
                      format,
                      `${path.basename(imagePath, '.png')}-${size}.${format}`
                    );
                    
                    if (format === 'webp') {
                      await resizedImage.webp({ quality: 80 }).toFile(outputPath);
                    } else if (format === 'png') {
                      await resizedImage.png({ quality: 100 }).toFile(outputPath);
                    } else {
                      await resizedImage.jpeg({ quality: 85 }).toFile(outputPath);
                    }
                  }
                }

                await fs.writeFile(
                  path.join(__dirname, '../dist', 'assets', 'images', 'metadata', `${path.basename(imagePath, '.png')}.json`),
                  JSON.stringify({ hasAlpha })
                );

                return sharpImage;
              },
              name: '[name]-[width].[ext]',
              outputPath: 'assets/images',
              sizes: [300, 600, 1200, 2000],
              placeholder: true,
              placeholderSize: 20,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/index.html'),
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  }
};
