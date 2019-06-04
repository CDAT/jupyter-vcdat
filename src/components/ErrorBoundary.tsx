import * as React from "react";

// An error boundary to catch errors without killing the UI
export default class ErrorBoundary extends React.Component {
  public static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: any, info: any): void {
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  public render() {
    return this.props.children;
  }
}
