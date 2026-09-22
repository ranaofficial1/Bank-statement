import { useState } from 'react';
import BankSelect from '../components/BankSelect.jsx';
import PdfDropzone from '../components/PdfDropzone.jsx';
import { uploadPdf, verifyUploadPassword, deleteUpload } from '../api/uploads.js';
import { startConversion, getConversion } from '../api/conversions.js';

export default function Converter() {
  const [bank, setBank] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | password_required | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [converting, setConverting] = useState(false);
  const [conversionError, setConversionError] = useState('');
  const [conversionResult, setConversionResult] = useState(null); // { conversion, transactions, logs }

  const resetToIdle = () => {
    setUploadedFile(null);
    setStatus('idle');
    setProgress(0);
    setPassword('');
    setPasswordError('');
    setErrorMessage('');
    setConversionResult(null);
    setConversionError('');
  };

  const handleFileSelected = async (file) => {
    setErrorMessage('');
    setStatus('uploading');
    setProgress(0);

    try {
      const result = await uploadPdf({ file, bankId: bank?.id, onProgress: setProgress });
      setUploadedFile(result);
      setStatus(result.status === 'password_required' ? 'password_required' : 'ready');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err?.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setPasswordError('');
    setVerifying(true);
    try {
      const result = await verifyUploadPassword(uploadedFile.id, password);
      setUploadedFile(result);
      setStatus('ready');
      setPassword('');
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Could not verify password.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (uploadedFile) {
      try {
        await deleteUpload(uploadedFile.id);
      } catch {
        // Best-effort cleanup - even if this fails server-side, the
        // user should still be able to try again from a clean slate.
      }
    }
    resetToIdle();
  };

  const handleConvert = async () => {
    if (!uploadedFile) return;
    setConverting(true);
    setConversionError('');
    setConversionResult(null);

    const result = await startConversion(uploadedFile.id);
    if (!result.success) {
      setConversionError(result.message);
      setConverting(false);
      return;
    }

    try {
      const details = await getConversion(result.conversion.id);
      setConversionResult(details);
    } catch (err) {
      setConversionError(err?.response?.data?.message || 'Converted, but could not load the results.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Convert a bank statement</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select your bank, then upload the PDF statement you want to convert.
        </p>

        <div className="mt-6">
          <BankSelect value={bank} onChange={setBank} />
        </div>

        <div className="mt-6">
          {(status === 'idle' || status === 'error') && (
            <PdfDropzone onFileSelected={handleFileSelected} disabled={!bank} />
          )}

          {status === 'error' && (
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          )}

          {status === 'uploading' && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">Uploading… {progress}%</p>
            </div>
          )}

          {status === 'password_required' && (
            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{uploadedFile?.original_filename}</span> is
                password-protected. Enter the PDF's password to continue.
              </p>
              {passwordError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordError}
                </p>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="PDF password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={verifying}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {verifying ? 'Verifying…' : 'Unlock'}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            </form>
          )}

          {status === 'ready' && uploadedFile && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">{uploadedFile.original_filename}</span> is ready
                ({Math.round(uploadedFile.file_size_bytes / 1024)} KB).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {converting ? 'Extracting transactions…' : 'Extract transactions'}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Remove &amp; upload a different file
                </button>
              </div>

              {conversionError && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {conversionError}
                </p>
              )}

              {conversionResult && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-800">
                    Extracted {conversionResult.transactions.length} transaction(s)
                    {conversionResult.logs.some((l) => l.level === 'warning') && (
                      <span className="ml-2 text-amber-600">
                        ({conversionResult.transactions.filter((t) => t.needs_review).length} flagged
                        for review)
                      </span>
                    )}
                  </p>
                  <div className="mt-2 max-h-80 overflow-auto rounded-md border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-right">Debit</th>
                          <th className="px-3 py-2 text-right">Credit</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionResult.transactions.map((t) => (
                          <tr
                            key={t.id}
                            className={`border-t border-slate-100 ${
                              t.needs_review ? 'bg-amber-50' : ''
                            }`}
                            title={t.needs_review ? t.review_reason : undefined}
                          >
                            <td className="whitespace-nowrap px-3 py-1.5">{t.txn_date}</td>
                            <td className="px-3 py-1.5">{t.description}</td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-right">
                              {t.debit ?? ''}
                            </td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-right">
                              {t.credit ?? ''}
                            </td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-right">
                              {t.balance ?? ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Rows highlighted in amber need review. Editing and saving corrections is
                    built in Phase 5; export to Excel/CSV/Tally is built in Phase 6.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
