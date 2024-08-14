import { h } from 'preact';
import { Router } from 'preact-router';
import ResponsiveImage from '../ResponsiveImage/ResponsiveImage';

const Home = () => (
  <div>
    <h1>Preact Responsive Image Demo</h1>
    <ResponsiveImage
      src="example.png"
      alt="Example responsive image"
      sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
    />
  </div>
);

const App = () => (
  <div id="app">
    <Router>
      <Home path="/" />
    </Router>
  </div>
);

export default App;
