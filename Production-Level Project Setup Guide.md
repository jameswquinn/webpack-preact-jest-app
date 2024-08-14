# Preact App with Responsive Images - Complete Setup Guide

This guide provides a comprehensive setup for a Preact application with responsive image handling using Webpack and Sharp.

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
└── .gitignore
```

## File Contents

### 1. package.json

```json
{
  "name": "preact-responsive-image-app",
  "version": "1.0.0",
  "description": "A production-ready Preact app with responsive image handling",
  "main": "src/index.js",
  "scripts": {
    "start": "webpack serve --config config/webpack.dev.js",
    "build": "webpack --config config/webpack.prod.js",
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
    "babel-loader": "^9.1.3",
    "clean-webpack-plugin": "^4.0.0",
    "css-loader": "^6.8.1",
    "css-minimizer-webpack-plugin": "^5.0.1",
    "dotenv-webpack": "^8.0.1",
    "file-loader": "^6.2.0",
    "html-webpack-plugin": "^5.5.3",
    "mini-css-extract-plugin": "^2.7.6",
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

### 2. config/webpack.common.js

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

### 3. config/webpack.dev.js

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

### 4. config/webpack.prod.js

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

### 5. src/components/ResponsiveImage/ResponsiveImage.js

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

### 6. src/components/App/App.js

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

### 7. src/index.js

```javascript
import { h, render } from 'preact';
import App from './components/App/App';
import './styles/global.css';

render(<App />, document.body);
```

### 8. src/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preact Responsive Image App</title>
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

### 9. src/styles/global.css

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

### 10. vercel.json

```json
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

### 11. .gitignore

```
node_modules/
dist/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.vercel
```

## Setup Instructions

1. Create a new directory for your project and navigate into it:
   ```
   mkdir preact-responsive-image-app && cd preact-responsive-image-app
   ```

2. Create the file structure as shown above.

3. Copy the contents of each file into the respective files in your project.

4. Initialize a new Git repository:
   ```
   git init
   ```

5. Install the dependencies:
   ```
   npm install
   ```

6. Place your source PNG images in the `public/images/` directory. For testing, you can use any PNG image and name it `example.png`.

7. Start the development server:
   ```
   npm start
   ```

8. To build the project for production:
   ```
   npm run build
   ```

## Deployment

### Vercel

1. Install the Vercel CLI:
   ```
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```
   vercel
   ```

3. Follow the prompts to link your project to your Vercel account.

## Usage

After setting up the project, you can use the `ResponsiveImage` component in your Preact application like this:

```jsx
import { ResponsiveImage } from './components/ResponsiveImage/ResponsiveImage';

const MyComponent = () => (
  <ResponsiveImage
    src="example.png"
    alt="An example image"
    sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
  />
);
```

This will display your image with proper responsive behavior and format fallbacks.
</antArtifact
