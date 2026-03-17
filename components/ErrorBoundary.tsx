"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-4 text-sm max-w-sm">
              There was an error loading this section. Try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
