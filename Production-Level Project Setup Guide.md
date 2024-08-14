# Complete Project Setup Guide for Preact App with Responsive Images

This document contains the full setup for a Preact application with responsive image handling, including all necessary files and their contents.

## Project Structure

```
project-root/
├── src/
│   ├── components/
│   │   ├── ResponsiveImage/
│   │   │   └── ResponsiveImage.js
│   │   └── App/
│   │       └── App.js
│   ├── styles/
│   │   └── global.css
│   ├── index.js
│   └── index.html
├── public/
│   └── images/
│       └── example.png
├── config/
│   ├── webpack.common.js
│   ├── webpack.dev.js
│   └── webpack.prod.js
├── package.json
├── vercel.json
├── .gitignore
└── .env.example
```

## File Contents

### package.json
```json
{
  "name": "preact-responsive-image-app",
  "version": "1.0.0",
  "description": "A production-ready Preact app with responsive image handling",
  "main": "src/index.js",
  "scripts": {
    "start": "webpack serve --config config/webpack.dev.js",
    "build": "webpack --config config/webpack.prod.js",
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write 'src/**/*.{js,css}'",
    "optimize-images": "node scripts/optimize-images.js",
    "deploy": "vercel"
  },
  "dependencies": {
    "preact": "^10.11.3",
    "preact-router": "^4.1.0"
  },
  "devDependencies": {
    "@babel/core": "^7.22.10",
    "@babel/preset-env": "^7.22.10",
    "@babel/plugin-transform-react-jsx": "^7.22.5",
    "@testing-library/preact": "^3.2.3",
    "babel-loader": "^9.1.3",
    "clean-webpack-plugin": "^4.0.0",
    "css-loader": "^6.8.1",
    "css-minimizer-webpack-plugin": "^5.0.1",
    "dotenv-webpack": "^8.0.1",
    "eslint": "^8.47.0",
    "eslint-plugin-preact": "^0.1.0",
    "file-loader": "^6.2.0",
    "html-webpack-plugin": "^5.5.3",
    "jest": "^29.6.2",
    "mini-css-extract-plugin": "^2.7.6",
    "prettier": "^3.0.1",
    "responsive-loader": "^3.1.2",
    "sharp": "^0.32.4",
    "style-loader": "^3.3.3",
    "terser-webpack-plugin": "^5.3.9",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1",
    "webpack-merge": "^5.9.0"
  }
}
```

### config/webpack.common.js
```javascript
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
```

### config/webpack.dev.js
```javascript
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: true,
    port: 8080,
  },
  plugins: [
    new Dotenv({
      path: './.env.development',
    }),
  ],
});
```

### config/webpack.prod.js
```javascript
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new Dotenv({
      path: './.env.production',
    }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        parallel: true,
      }),
    ],
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});
```

### src/components/ResponsiveImage/ResponsiveImage.js
```javascript
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const ResponsiveImage = ({ src, alt, sizes }) => {
  const [imageMeta, setImageMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/assets/images/metadata/${src.replace(/\.[^/.]+$/, "")}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load image metadata');
        }
        return response.json();
      })
      .then(setImageMeta)
      .catch(err => {
        console.error('Error loading image metadata:', err);
        setError('Failed to load image. Please try again later.');
      });
  }, [src]);

  if (error) return <div class="error">{error}</div>;
  if (!imageMeta) return <div class="loading">Loading...</div>;

  const basePath = '/assets/images';
  const webpSrcSet = [300, 600, 1200, 2000]
    .map(size => `${basePath}/webp/${src.replace(/\.[^/.]+$/, "")}-${size}.webp ${size}w`)
    .join(', ');
  
  const fallbackFormat = imageMeta.hasAlpha ? 'png' : 'jpg';
  const fallbackSrcSet = [300, 600, 1200, 2000]
    .map(size => `${basePath}/${fallbackFormat}/${src.replace(/\.[^/.]+$/, "")}-${size}.${fallbackFormat} ${size}w`)
    .join(', ');

  return (
    <img
      src={`${basePath}/${fallbackFormat}/${src.replace(/\.[^/.]+$/, "")}-600.${fallbackFormat}`}
      srcSet={`${webpSrcSet}, ${fallbackSrcSet}`}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      onError={() => setError('Failed to load image. Please try again later.')}
    />
  );
};

export default ResponsiveImage;
```

### src/components/App/App.js
```javascript
import { h, Component } from 'preact';
import ResponsiveImage from '../ResponsiveImage/ResponsiveImage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const App = () => (
  <div id="app">
    <h1>Preact Responsive Image Demo</h1>
    <ErrorBoundary>
      <ResponsiveImage
        src="example.png"
        alt="Example responsive image"
        sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
      />
    </ErrorBoundary>
  </div>
);

export default App;
```

### src/index.js
```javascript
import { h, render } from 'preact';
import App from './components/App/App';
import './styles/global.css';

render(<App />, document.body);
```

### src/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Preact Responsive Image App</title>
    <meta name="description" content="A Preact application demonstrating responsive image handling">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <!-- You can add any additional meta tags, stylesheets, or scripts here -->
</head>
<body>
    <div id="app"></div>
    <!-- The Preact app will be rendered inside this div -->
    <!-- Webpack will automatically inject the bundled JavaScript here -->
</body>
</html>
```

### src/styles/global.css
```css
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
```

### .env.example
```
# Application
APP_NAME=PreactResponsiveImageApp
NODE_ENV=development

# Server
PORT=3000

# Image Processing
MAX_IMAGE_SIZE=5000000 # 5MB in bytes
ALLOWED_IMAGE_TYPES=png,jpg,jpeg

# API Keys (replace with your actual keys in .env.development and .env.production)
VERCEL_API_TOKEN=your_vercel_api_token_here

# Database (if applicable)
DB_HOST=localhost
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name

# Caching
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_WEBP_CONVERSION=true
ENABLE_LAZY_LOADING=true

# Analytics (if applicable)
GOOGLE_ANALYTICS_ID=your_ga_id_here

# Content Delivery Network (if applicable)
CDN_URL=https://your-cdn-url.com

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

### .gitignore
```
node_modules/
dist/
.env
.env.local
.env.development
.env.test
.env.production
.vercel
```

### vercel.json
```
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    {
      "src": "/assets/images/(.*)",
      "dest": "/assets/images/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```
