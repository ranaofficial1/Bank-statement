import { useEffect, useState } from 'react';
import apiClient from '../api/client.js';

/**
 * Calls GET /api/health on mount and displays whether the API and
 * the MySQL database are reachable. This is Phase 1's way of proving
 * the three pieces (frontend, backend, database) are wired together.
 */
export default function BackendStatus() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get('/api/health')
      .then((res) => {
        if (!cancelled) setState({ loading: false, error: null, data: res.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: err.message || 'Could not reach the backend API.',
            data: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Checking backend connection…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">Could not reach the backend API.</p>
        <p className="mt-1 text-red-600">{state.error}</p>
        <p className="mt-2 text-red-500">
          Make sure the backend server is running on the URL set in{' '}
          <code className="rounded bg-red-100 px-1">VITE_API_BASE_URL</code>.
        </p>
      </div>
    );
  }

  const dbConnected = state.data?.database === 'connected';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        API server: <span className="font-medium">reachable</span>
      </p>
      <p className="mt-2 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            dbConnected ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
        MySQL database:{' '}
        <span className="font-medium">
          {dbConnected ? 'connected' : 'not connected yet'}
        </span>
      </p>
      {!dbConnected && state.data?.databaseError && (
        <p className="mt-2 text-amber-600">{state.data.databaseError}</p>
      )}
    </div>
  );
}
