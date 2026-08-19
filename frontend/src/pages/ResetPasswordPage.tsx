import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorUtils';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Resetiranje lozinke nije uspjelo.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Nevažeća poveznica</h1>
          <p className="auth-subtitle">
            Poveznica za resetiranje lozinke nije ispravna ili joj nedostaje token.
          </p>
          <p className="auth-footer">
            <Link to="/forgot-password">Zatražite novu poveznicu</Link>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Lozinka promijenjena</h1>
          <p className="auth-subtitle">
            Vaša lozinka je uspješno promijenjena. Preusmjeravamo vas na prijavu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Postavite novu lozinku</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nova lozinka <span className="hint">(min. 6 znakova)</span></label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Potvrdite lozinku</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Spremanje...' : 'Postavi novu lozinku'}
          </button>
        </form>
      </div>
    </div>
  );
}
