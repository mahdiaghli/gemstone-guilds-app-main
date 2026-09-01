import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryState = { hasError: boolean };

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-amber-100">
          <p>Something went wrong. You can reload and continue from the menu.</p>
          <button
            className="rounded-md border border-amber-400 px-4 py-2"
            type="button"
            onClick={() => window.location.assign("/menu")}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
