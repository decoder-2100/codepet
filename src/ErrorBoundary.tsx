import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught React error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontFamily: "monospace",
            background: "#1a1a2e",
            color: "#e0e0e0",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>😿</div>
          <h2 style={{ margin: "0 0 8px" }}>宠物累坏了</h2>
          <p style={{ margin: "0 0 24px", opacity: 0.7 }}>
            出了点问题，刷新一下试试吧
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 24px",
              background: "#4a90d9",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          >
            刷新
          </button>
          {this.state.error && (
            <details
              style={{
                marginTop: "16px",
                maxWidth: "400px",
                fontSize: "12px",
                opacity: 0.5,
              }}
            >
              <summary>错误详情</summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
