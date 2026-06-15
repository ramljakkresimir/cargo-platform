import { useState, useEffect, FormEvent } from 'react';
import { companiesService } from '../services/companies.service';
import { Company } from '../types';

const COMPANY_TYPES = [
  { value: 'transport', label: 'Transport Company' },
  { value: 'freight_forwarder', label: 'Freight Forwarder' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'trader', label: 'Trader' },
  { value: 'other', label: 'Other' },
];

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    companyType: 'transport',
    country: 'Bosnia and Herzegovina',
    city: '',
    address: '',
    taxNumber: '',
    phone: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await companiesService.getMyCompany();
      setCompany(res.data);
      setForm({
        companyName: res.data.companyName,
        companyType: res.data.companyType,
        country: res.data.country,
        city: res.data.city,
        address: res.data.address || '',
        taxNumber: res.data.taxNumber || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
        description: res.data.description || '',
      });
    } catch (err: any) {
      // 404 means no company yet — that's expected for new users
      if (err.response?.status !== 404) {
        setError('Failed to load company profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (company) {
        const res = await companiesService.updateMyCompany(form);
        setCompany(res.data);
        setIsEditing(false);
        setSuccess('Company profile updated successfully.');
      } else {
        const res = await companiesService.createCompany(form);
        setCompany(res.data);
        setIsEditing(false);
        setSuccess('Company profile created successfully.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Company Profile</h1>
        {company && !isEditing && (
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* View mode */}
      {company && !isEditing && (
        <div className="detail-card">
          <div className="detail-grid">
            <div><span className="label">Company Name</span><p>{company.companyName}</p></div>
            <div><span className="label">Type</span><p>{company.companyType}</p></div>
            <div><span className="label">Country</span><p>{company.country}</p></div>
            <div><span className="label">City</span><p>{company.city}</p></div>
            {company.address && <div><span className="label">Address</span><p>{company.address}</p></div>}
            {company.taxNumber && <div><span className="label">Tax Number</span><p>{company.taxNumber}</p></div>}
            {company.phone && <div><span className="label">Phone</span><p>{company.phone}</p></div>}
            {company.email && <div><span className="label">Email</span><p>{company.email}</p></div>}
            {company.description && (
              <div className="full-width">
                <span className="label">Description</span>
                <p>{company.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {(!company || isEditing) && (
        <div className="form-card">
          <h2>{company ? 'Edit Company Profile' : 'Create Company Profile'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Company Type *</label>
                <select name="companyType" value={form.companyType} onChange={handleChange} required>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country *</label>
                <input name="country" value={form.country} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input name="city" value={form.city} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Tax Number (ID broj)</label>
                <input name="taxNumber" value={form.taxNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Business Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of your business..."
              />
            </div>

            <div className="form-actions">
              {isEditing && (
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : company ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
