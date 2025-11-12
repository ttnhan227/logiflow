import React, { useEffect, useState } from 'react';
import settingsService from '../../services/admin/settingsService';
import './admin.css';

const PAGE_SIZE = 10;

const emptyForm = {
  category: '',
  key: '',
  value: '',
  isEncrypted: false,
  description: '',
};

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSettings = async (pageNum = 0, searchTerm = '') => {
    setLoading(true);
    try {
      let data;
      if (searchTerm) {
        data = await settingsService.searchSettings(searchTerm, pageNum, PAGE_SIZE);
      } else {
        data = await settingsService.getSettings(pageNum, PAGE_SIZE);
      }
      setSettings(data.content);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (e) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEdit = setting => {
    setEditingId(setting.settingId);
    setForm({
      category: setting.category,
      key: setting.key,
      value: setting.value === '***ENCRYPTED***' ? '' : setting.value,
      isEncrypted: setting.isEncrypted,
      description: setting.description || '',
    });
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this setting?')) return;
    try {
      await settingsService.deleteSetting(id);
      fetchSettings(page, search);
    } catch {
      setError('Delete failed');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await settingsService.updateSetting({ settingId: editingId, ...form });
      } else {
        await settingsService.createSetting(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchSettings(page, search);
    } catch {
      setError('Save failed. Check required fields.');
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchSettings(0, search);
  };

  return (
    <div className="admin-main-inner">
      <h2>System Settings</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input name="category" value={form.category} onChange={handleInputChange} placeholder="Category" maxLength={50} required />
          <input name="key" value={form.key} onChange={handleInputChange} placeholder="Key" maxLength={100} required />
          <input name="value" value={form.value} onChange={handleInputChange} placeholder="Value" required />
          <label>
            <input type="checkbox" name="isEncrypted" checked={form.isEncrypted} onChange={handleInputChange} /> Encrypted
          </label>
          <input name="description" value={form.description} onChange={handleInputChange} placeholder="Description" maxLength={255} />
          <button type="submit" className="btn">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" className="btn" onClick={handleCancel}>Cancel</button>}
        </div>
        {error && <div className="error-banner">{error}</div>}
      </form>
      <form className="admin-form" onSubmit={handleSearch} style={{marginTop:8}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search settings..." />
        <button type="submit" className="btn">Search</button>
      </form>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Key</th>
              <th>Value</th>
              <th>Encrypted</th>
              <th>Description</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.map(setting => (
              <tr key={setting.settingId}>
                <td>{setting.category}</td>
                <td>{setting.key}</td>
                <td>{setting.value}</td>
                <td>{setting.isEncrypted ? 'Yes' : 'No'}</td>
                <td>{setting.description}</td>
                <td>{setting.createdAt?.slice(0,19).replace('T',' ')}</td>
                <td>{setting.updatedAt?.slice(0,19).replace('T',' ')}</td>
                <td>
                  <button className="btn" onClick={() => handleEdit(setting)}>Edit</button>
                  <button className="btn" onClick={() => handleDelete(setting.settingId)}>Delete</button>
                </td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:'center'}}>No settings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button className="btn" disabled={page === 0} onClick={() => fetchSettings(page-1, search)}>Prev</button>
        <span>Page {page+1}</span>
        <button className="btn" disabled={(page+1)*PAGE_SIZE >= totalElements} onClick={() => fetchSettings(page+1, search)}>Next</button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
