// Um erro numa parte da tela não derruba o site inteiro (nem o globo).
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Traveling: erro na interface', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="planner-empty" role="alert">
        <p>Esta parte não pôde ser mostrada.</p>
        <button className="secondary-button" type="button" onClick={() => this.setState({ failed: false })}>Tentar de novo</button>
      </div>
    );
  }
}
