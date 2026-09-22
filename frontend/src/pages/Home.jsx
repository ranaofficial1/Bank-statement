import BackendStatus from '../components/BackendStatus.jsx';

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Setup status</h2>
        <p className="mt-1 text-sm text-slate-500">
          This checks that the React frontend can reach the Express backend,
          and that the backend can reach MySQL.
        </p>
        <div className="mt-4">
          <BackendStatus />
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        This is a placeholder landing page. The real, original marketing UI
        arrives in Phase 8 — for now, use Sign up / Log in above to try the
        authentication system built in Phase 2.
      </p>
    </main>
  );
}
