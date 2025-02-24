'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#342e29] mb-4">
              Something went wrong
            </h2>
            <p className="text-[#51514d] mb-6 max-w-md">
              An error occurred while rendering this page. Please try refreshing or contact
              support if the problem persists.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Refresh Page
              </Button>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-[#e7e4df] rounded-lg text-left">
                <p className="text-sm font-medium text-[#342e29] mb-2">
                  Error details:
                </p>
                <pre className="text-xs text-[#51514d] overflow-auto max-h-40">
                  {this.state.error?.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
