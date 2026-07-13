import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorUtils';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(form);
      navigate('/login');
    } catch (err) {
      setError(extractErrorMessage(err, 'Registracija nije uspjela. Pokušajte ponovo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Otvorite račun</h1>
        <p className="auth-subtitle">Pridružite se CargoConnectu</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Ime</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Nikola"
                required
              />
            </div>
            <div className="form-group">
              <label>Prezime</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Kovačević"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vas@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Lozinka <span className="hint">(min. 6 znakova)</span></label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Telefon <span className="hint">(neobavezno)</span></label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+387 61 123 456"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Otvaranje računa...' : 'Otvori račun'}
          </button>
        </form>

        <p className="auth-footer">
          Već imate račun? <Link to="/login">Prijavite se</Link>
        </p>
      </div>
    </div>
  );
}
