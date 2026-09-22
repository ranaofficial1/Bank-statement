import { useEffect, useState } from 'react';
import { searchBanks } from '../api/banks.js';

export default function BankSelect({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [banks, setBanks] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      searchBanks(query)
        .then((results) => {
          if (!cancelled) setBanks(results);
        })
        .catch(() => {
          if (!cancelled) setBanks([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (bank) => {
    onChange(bank);
    setQuery(bank.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor="bank" className="block text-sm font-medium text-slate-700">
        Select your bank
      </label>
      <div className="relative mt-1">
        <input
          id="bank"
          type="text"
          value={value ? value.name : query}
          onChange={(e) => {
            onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search for your bank…"
          autoComplete="off"
          className="w-full rounded-md border border-slate-300 px-3 py-2 pr-9 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" />
        </svg>
      </div>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
          {!loading && banks.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">No banks found.</li>
          )}
          {!loading &&
            banks.map((bank) => (
              <li key={bank.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(bank)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {bank.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
