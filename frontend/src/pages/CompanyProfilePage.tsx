import { useState, useEffect, FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { companiesService } from '../services/companies.service';
import { Company } from '../types';
import { extractErrorMessage } from '../utils/errorUtils';

const COMPANY_TYPES = [
  { value: 'transport', label: 'Prijevoznička tvrtka' },
  { value: 'freight_forwarder', label: 'Špediter' },
  { value: 'manufacturer', label: 'Proizvođač' },
  { value: 'trader', label: 'Trgovac' },
  { value: 'other', label: 'Ostalo' },
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
    country: 'Bosna i Hercegovina',
    city: '',
    address: '',
    taxNumber: '',
    phone: '',
    email: '',
    description: '',
  });

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
    } catch (err) {
      // 404 means no company yet — that's expected for new users
      if (!isAxiosError(err) || err.response?.status !== 404) {
        setError('Učitavanje profila tvrtke nije uspjelo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetching over the network — the setState calls in fetchCompany's
    // catch/finally are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompany();
  }, []);

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
        setSuccess('Profil tvrtke je uspješno ažuriran.');
      } else {
        const res = await companiesService.createCompany(form);
        setCompany(res.data);
        setIsEditing(false);
        setSuccess('Profil tvrtke je uspješno kreiran.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Spremanje profila tvrtke nije uspjelo.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><p className="loading">Učitavanje...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Profil tvrtke</h1>
          {!company && !isEditing && (
            <p className="page-subtitle">Napravite profil tvrtke kako biste mogli objavljivati oglase.</p>
          )}
        </div>
        {company && !isEditing && (
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            Uredi profil
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* View mode */}
      {company && !isEditing && (
        <div className="detail-card">
          <div className="detail-grid">
            <div><span className="label">Naziv tvrtke</span><p>{company.companyName}</p></div>
            <div><span className="label">Vrsta</span><p>{company.companyType}</p></div>
            <div><span className="label">Država</span><p>{company.country}</p></div>
            <div><span className="label">Grad</span><p>{company.city}</p></div>
            {company.address && <div><span className="label">Adresa</span><p>{company.address}</p></div>}
            {company.taxNumber && <div><span className="label">ID broj</span><p>{company.taxNumber}</p></div>}
            {company.phone && <div><span className="label">Telefon</span><p>{company.phone}</p></div>}
            {company.email && <div><span className="label">E-mail</span><p>{company.email}</p></div>}
            {company.description && (
              <div className="full-width">
                <span className="label">Opis</span>
                <p>{company.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {(!company || isEditing) && (
        <div className="form-card">
          <h2>{company ? 'Uredi profil tvrtke' : 'Kreiraj profil tvrtke'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Naziv tvrtke *</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Vrsta tvrtke *</label>
                <select name="companyType" value={form.companyType} onChange={handleChange} required>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Država *</label>
                <input name="country" value={form.country} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Grad *</label>
                <input name="city" value={form.city} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Adresa</label>
                <input name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>ID broj</label>
                <input name="taxNumber" value={form.taxNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Telefon</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Poslovni e-mail</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Opis</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Kratak opis vaše djelatnosti..."
              />
            </div>

            <div className="form-actions">
              {isEditing && (
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Odustani
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Spremanje...' : company ? 'Spremi promjene' : 'Kreiraj profil'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
