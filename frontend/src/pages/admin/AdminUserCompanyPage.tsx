import { useState, useEffect, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { adminService } from '../../services/admin.service';
import { Company, User } from '../../types';
import { extractErrorMessage } from '../../utils/errorUtils';
import { COMPANY_TYPES, companyTypeLabel } from '../../constants/postTypes';
import EmptyState from '../../components/EmptyState';

export default function AdminUserCompanyPage() {
  const { id } = useParams<{ id: string }>();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyMissing, setCompanyMissing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    companyType: 'transport',
    country: '',
    city: '',
    address: '',
    taxNumber: '',
    phone: '',
    email: '',
    description: '',
  });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const userRes = await adminService.getUserById(id);
      setTargetUser(userRes.data);
    } catch {
      setError('Učitavanje korisnika nije uspjelo.');
      setLoading(false);
      return;
    }

    try {
      const companyRes = await adminService.getUserCompany(id);
      setCompany(companyRes.data);
      setCompanyMissing(false);
      setForm({
        companyName: companyRes.data.companyName,
        companyType: companyRes.data.companyType,
        country: companyRes.data.country,
        city: companyRes.data.city,
        address: companyRes.data.address || '',
        taxNumber: companyRes.data.taxNumber || '',
        phone: companyRes.data.phone || '',
        email: companyRes.data.email || '',
        description: companyRes.data.description || '',
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setCompanyMissing(true);
      } else {
        setError('Učitavanje profila tvrtke nije uspjelo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetching over the network — the setState calls in fetchData's
    // catch/finally are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminService.updateUserCompany(id, form);
      setCompany(res.data);
      setIsEditing(false);
      setSuccess('Profil tvrtke je uspješno ažuriran.');
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
          <Link to="/admin/users" className="table-link">← Natrag na korisnike</Link>
          <h1>Profil tvrtke korisnika</h1>
          {targetUser && (
            <p className="page-subtitle">
              {targetUser.firstName} {targetUser.lastName} · {targetUser.email}
            </p>
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

      {companyMissing && (
        <EmptyState message="Ovaj korisnik još nema kreiran profil tvrtke." />
      )}

      {/* View mode */}
      {company && !isEditing && (
        <div className="detail-card">
          <div className="detail-grid">
            <div><span className="label">Naziv tvrtke</span><p>{company.companyName}</p></div>
            <div><span className="label">Vrsta</span><p>{companyTypeLabel(company.companyType)}</p></div>
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

      {/* Edit form */}
      {company && isEditing && (
        <div className="form-card">
          <h2>Uredi profil tvrtke</h2>
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
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                Odustani
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Spremanje...' : 'Spremi promjene'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
