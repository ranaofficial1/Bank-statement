import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Welcome, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        <p className="mt-6 text-sm text-slate-500">
          This is a protected placeholder. Upload, conversion history and
          exports are built in later phases (3, 6, 7).
        </p>
      </div>
    </main>
  );
}
