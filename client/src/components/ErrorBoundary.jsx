import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-8 font-sans">
          <div className="bg-white max-w-md w-full text-center space-y-6 p-10 rounded-[32px] shadow-premium border border-surface-200">
            <div className="w-20 h-20 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-danger-50/50">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-[#111827] mb-2">Oops, something went wrong.</h2>
              <p className="text-[#6B7280] font-medium text-lg leading-relaxed">Don't worry, your data is safe. Let's try refreshing the page to get back on track.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#2D213F] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" /> Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
