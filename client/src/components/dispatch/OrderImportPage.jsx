import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import * as XLSX from 'xlsx';
import {
  Button,
  Card,
  CardContent,
  Badge,
  PageHeader,
  Alert,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui';
import {
  LuCloudUpload,
  LuDownload,
  LuFileSpreadsheet,
  LuArrowLeft,
  LuCircleCheck,
  LuTriangleAlert,
  LuFileText,
} from 'react-icons/lu';

export const OrderImportPage = () => {
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
        if (!rows || rows.length === 0) return setError('CSV file appears to be empty.');
        const headerLine = rows.find((r) => r && r.trim().length > 0) || '';
        const headers = headerLine.split(',').map((h) => h.trim());
        const dataRows = rows
          .slice(rows.indexOf(headerLine) + 1)
          .filter(Boolean)
          .slice(0, 5)
          .map((r) => r.split(','));
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
          if (!json || json.length === 0) return setError('Excel worksheet is empty.');
          const headers = json[0].map((h) => (h === undefined || h === null ? '' : String(h).trim()));
          const dataRows = json.slice(1, 6);
          setPreview({ headers, rows: dataRows });
        } catch {
          setError('Failed to parse Excel file for live preview.');
        }
      };
      reader.readAsArrayBuffer(f);
    } else {
      setError('Unsupported file type for preview. CSV or Excel (XLSX) required.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Please select a CSV or Excel manifest file to upload.');

    if (preview && preview.headers) {
      const missing = getMissingRequiredHeaders(preview.headers);
      if (missing.length > 0) {
        return setError('Missing required manifest columns: ' + missing.join(', '));
      }
    }

    setLoading(true);
    try {
      const res = await orderService.importOrders(file);
      setResult(res);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Manifest import process failed.');
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
    } catch {
      setError('Failed to generate template download.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Import Order Manifests"
        description="Bulk upload shipping manifests via formatted CSV or Excel worksheets."
        badge={<Badge variant="brand">Bulk Ingestion</Badge>}
        actions={
          <Link to="/dispatch/orders">
            <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
              Back to Orders
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload & Template Downloads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Upload Form Card */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Upload File
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Select a structured CSV or XLSX file containing customer orders.
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label
              style={{
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-surface-subtle)',
              }}
            >
              <input type="file" accept=".csv, .xlsx, .xls" onChange={onFileChange} style={{ display: 'none' }} />
              <LuCloudUpload size={28} color="var(--color-brand-600)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                {file ? file.name : 'Choose CSV or Excel Spreadsheet'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max file size: 10MB</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              disabled={!file}
              loading={loading}
              leftIcon={<LuCloudUpload size={16} />}
              style={{ width: '100%' }}
            >
              {loading ? 'Processing Orders...' : 'Import Manifest'}
            </Button>
          </form>
        </Card>

        {/* Template Downloads Card */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
            Official Import Templates
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Ensure your column headers match required system schemas: Customer Name, Pickup Address, Delivery Address, Weight (tons), and Pickup Type.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('csv')}
              leftIcon={<LuDownload size={14} />}
            >
              CSV Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('xlsx')}
              leftIcon={<LuFileSpreadsheet size={14} />}
            >
              Excel (XLSX) Template
            </Button>
          </div>
        </Card>
      </div>

      {/* Preview Table */}
      {preview && (
        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Data Ingestion Preview (First {preview.rows.length} rows)
            </div>
            <Badge variant="neutral" size="sm">{preview.headers.length} Columns Detected</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {preview.headers.map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row, ri) => (
                <TableRow key={ri}>
                  {preview.headers.map((_, ci) => (
                    <TableCell key={ci}>{row[ci] ?? '—'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Result Metrics */}
      {result && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 16px 0' }}>
            Import Execution Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Rows</span>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {result.totalRows ?? 0}
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--color-success-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-success-200)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-success-700)', textTransform: 'uppercase', fontWeight: 600 }}>Created</span>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success-700)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {result.successCount ?? 0}
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: (result.failureCount || 0) > 0 ? 'var(--color-danger-50)' : 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: (result.failureCount || 0) > 0 ? '1px solid var(--color-danger-200)' : '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '11px', color: (result.failureCount || 0) > 0 ? 'var(--color-danger-700)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Failed</span>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: (result.failureCount || 0) > 0 ? 'var(--color-danger-700)' : 'var(--text-muted)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {result.failureCount ?? 0}
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-200)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-danger-900)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LuTriangleAlert size={15} />
                Validation Warnings & Error Logs:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-xs)', color: 'var(--color-danger-800)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <Link to="/dispatch/orders">
              <Button variant="primary">View Dispatch Queue</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

function getMissingRequiredHeaders(headers) {
  const required = ['Customer Name', 'Pickup Address', 'Delivery Address', 'Weight (tons)', 'Pickup Type'];
  const lower = headers.map((h) => String(h).toLowerCase());
  return required.filter((r) => !lower.includes(r.toLowerCase()));
}

export default OrderImportPage;
