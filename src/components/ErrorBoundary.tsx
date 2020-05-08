import * as React from "react";

interface IErrorProps {
  children: React.ReactNode;
}

// An error boundary to catch errors without killing the UI
export default class ErrorBoundary extends React.Component<IErrorProps> {
  public static getDerivedStateFromError(error: any): {} {
    console.error(error);
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  constructor(props: IErrorProps) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: any, info: any): void {
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  public render(): React.ReactNode {
    return this.props.children;
  }
}
