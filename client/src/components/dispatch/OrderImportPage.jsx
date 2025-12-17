import React, { useState } from 'react';
import { orderService } from '../../services';
import './dispatch.css';
import * as XLSX from 'xlsx';

const OrderImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(null);

    if (!f) return;
    const name = f.name || '';
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const rows = text.split(/\r?\n/);
        if (!rows || rows.length === 0) return setError('CSV is empty');
        const headerLine = rows.find(r => r && r.trim().length > 0) || '';
        const headers = headerLine.split(',').map(h => h.trim());
        const dataRows = rows.slice(rows.indexOf(headerLine) + 1).filter(Boolean).slice(0, 5).map(r => r.split(','));
        setPreview({ headers, rows: dataRows });
      };
      reader.readAsText(f, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!json || json.length === 0) return setError('Excel is empty');
          const headers = json[0].map(h => (h === undefined || h === null) ? '' : String(h).trim());
          const dataRows = json.slice(1, 6);
          setPreview({ headers, rows: dataRows });
        } catch (ex) {
          console.error('Excel parse error', ex);
          setError('Failed to parse Excel for preview');
        }
      };
      reader.readAsArrayBuffer(f);
    } else {
      setError('Unsupported file type for preview. Server will still accept the file.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Please choose a file');

    // basic client-side validation (if preview available)
    if (preview && preview.headers) {
      const missing = getMissingRequiredHeaders(preview.headers);
      if (missing.length > 0) {
        return setError('Missing required columns: ' + missing.join(', '));
      }
    }

    setLoading(true);
    try {
      const res = await orderService.importOrders(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (format) => {
    try {
      const blob = await orderService.downloadTemplate(format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', format === 'xlsx' ? 'order_import_template.xlsx' : 'order_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed', err);
      setError('Template download failed');
    }
  };

  return (
    <div className="container">

      <h2>Import Orders (CSV / Excel)</h2>

      <div className="action-bar">
        <div>
          <button className="btn" onClick={() => downloadTemplate('csv')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/></svg>
            Download CSV
          </button>
          <button className="btn" style={{ marginLeft: 8 }} onClick={() => downloadTemplate('xlsx')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
            Download Excel
          </button>
        </div>

        <div className="spacer" />

        <form onSubmit={onSubmit} style={{ margin: 0 }}>
          <input type="file" accept=".csv, .xlsx, .xls" onChange={onFileChange} />
          <button type="submit" className="btn" style={{ marginLeft: 8 }} disabled={loading}>{loading ? 'Importing...' : 'Import'}</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {preview && (
        <div className="preview">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Preview (first 5 rows)</strong>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{preview.rows.length} rows shown</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#374151' }}>Headers: {preview.headers.join(', ')}</div>
          <table>
            <thead>
              <tr>{preview.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {preview.rows.map((r, ri) => (
                <tr key={ri}>{preview.headers.map((_, ci) => <td key={ci}>{r[ci] ?? ''}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          <div>Total rows: {result.totalRows}</div>
          <div>Success: {result.successCount}</div>
          <div>Failed: {result.failureCount}</div>
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4>Errors</h4>
              <ul>
                {result.errors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getMissingRequiredHeaders(headers) {
  const required = ['Customer Name', 'Pickup Address', 'Delivery Address', 'Weight (tons)', 'Pickup Type'];
  const lower = headers.map(h => String(h).toLowerCase());
  return required.filter(r => !lower.includes(r.toLowerCase()));
}

export default OrderImportPage;
