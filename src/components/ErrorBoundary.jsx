import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-400 p-4 text-center">
                    <div>
                        <p className="font-bold mb-2">⚠️ Error de visualización 3D</p>
                        <p className="text-xs font-mono max-w-xs mx-auto overflow-hidden text-ellipsis">
                            {this.state.error?.message || 'Error desconocido'}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-4 px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-600 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
