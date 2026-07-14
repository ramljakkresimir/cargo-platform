import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired] = useState(() => {
    const expired = sessionStorage.getItem('sessionExpired') === '1';
    if (expired) sessionStorage.removeItem('sessionExpired');
    return expired;
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      const { access_token, user } = response.data;
      login(access_token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err, 'Prijava nije uspjela. Pokušajte ponovo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Prijava</h1>
        <p className="auth-subtitle">Dobrodošli natrag na CargoConnect</p>

        {sessionExpired && !error && (
          <div className="alert alert-error">Vaša sesija je istekla. Prijavite se ponovo.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Prijava u tijeku...' : 'Prijavi se'}
          </button>
        </form>

        <p className="auth-footer">
          Nemate račun? <Link to="/register">Registrirajte se</Link>
        </p>
      </div>
    </div>
  );
}
