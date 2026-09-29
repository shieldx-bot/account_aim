import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorBreadcrumb } from '@/utils/telemetry';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  contextName?: string;
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
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = this.props.contextName || 'Component_ErrorBoundary';
    logErrorBreadcrumb(context, error, { componentStack: errorInfo.componentStack });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-surface border border-status-error/30 rounded-xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-status-error/10 text-status-error">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            {this.props.fallbackTitle || 'Một phần giao diện tạm thời gặp sự cố'}
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
            Lỗi đã được cô lập an toàn để không làm ảnh hưởng đến các chức năng khác của bạn.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-blue hover:bg-primary-hover rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại phần này
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
