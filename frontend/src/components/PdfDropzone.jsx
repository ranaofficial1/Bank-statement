import { useCallback, useRef, useState } from 'react';

const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 15);

export default function PdfDropzone({ onFileSelected, disabled }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const validateAndEmit = useCallback(
    (file) => {
      setError('');
      if (!file) return;

      const isPdfType = file.type === 'application/pdf';
      const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
      if (!isPdfType || !isPdfExt) {
        setError('Only PDF files are supported.');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
        return;
      }

      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    validateAndEmit(e.dataTransfer.files?.[0]);
  };

  const handleChange = (e) => {
    validateAndEmit(e.target.files?.[0]);
    e.target.value = '';
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
            : dragActive
            ? 'cursor-pointer border-slate-500 bg-slate-50 text-slate-700'
            : 'cursor-pointer border-slate-300 text-slate-500 hover:border-slate-400'
        }`}
      >
        <p className="text-sm font-medium">
          {disabled ? 'Select a bank first' : 'Drag and drop your PDF here'}
        </p>
        {!disabled && (
          <p className="mt-1 text-xs text-slate-400">
            or click to browse — max {MAX_SIZE_MB} MB
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
