import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // In production integrate with your monitoring/logging service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center space-y-4 max-w-sm">
            <img src="/kakebe-shop.png" alt="Kakebe Shop" className="h-14 w-14 rounded-2xl object-cover mx-auto shadow-lg" />
            <div>
              <h1 className="text-base font-semibold text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred. Please refresh the page.
              </p>
            </div>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
