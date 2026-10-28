import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Gunpowder v1.7.0 Uncaught Runtime Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500/30 selection:text-rose-200">
          <div className="w-full max-w-xl rounded-2xl border border-rose-900/60 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-rose-900/40 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-600/50 flex items-center justify-center text-xl text-rose-400 font-bold shrink-0">
                ⚠️
              </div>
              <div>
                <h1 className="text-lg font-bold text-rose-300 font-mono tracking-tight">
                  Gunpowder v1.7.0 — Сбой инициализации
                </h1>
                <p className="text-xs text-slate-400">
                  Возникло непредвиденное исключение при рендере интерфейса или чтении сохранения.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 font-mono text-xs text-rose-400/90 mb-5 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {this.state.error?.toString() || 'Неизвестная ошибка рендера'}
              {this.state.errorInfo?.componentStack && (
                <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Перезагрузить страницу</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAll}
                className="w-full py-2 px-4 rounded-xl border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>🧹</span>
                <span>Сбросить локальные данные (localStorage) и начать с нуля</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-4 font-mono">
              Оптимизировано для планшетов (Poco Pad M1) и GitHub Pages.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
