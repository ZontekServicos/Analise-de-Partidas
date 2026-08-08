import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro inesperado na aplicação.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="rounded-md border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-950">Não foi possível carregar a aplicação.</h1>
            <p className="mt-2 text-sm text-slate-600">Atualize a página ou tente novamente mais tarde.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
