import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

/**
 * Production-Grade Global React Error Boundary
 * Catches unhandled JS runtime exceptions in child component trees and presents a
 * sleek, user-friendly recovery UI without breaking the rest of the application.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Foclyra ErrorBoundary caught an unhandled exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shadow-xl">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Something went unexpected</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Foclyra caught a minor UI exception. Don't worry, your course notes, and learning state are completely safe in local storage!
            </p>
          </div>

          {this.state.error?.message && (
            <div className="p-3.5 rounded-xl bg-card/90 border border-border text-left font-mono text-[11px] text-muted-foreground max-w-lg overflow-x-auto truncate">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reload Application</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-4 py-2.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Home size={14} />
              <span>Return Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
