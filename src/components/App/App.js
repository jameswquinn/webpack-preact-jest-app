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
