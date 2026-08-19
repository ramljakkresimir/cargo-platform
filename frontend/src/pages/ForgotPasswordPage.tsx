import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorUtils';
import Turnstile from '../components/Turnstile';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Molimo potvrdite CAPTCHA izazov.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email, captchaToken });
      // Always shown regardless of whether the account exists — the backend response
      // is deliberately generic so this page can't be used to enumerate accounts.
      setSubmitted(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Zahtjev nije uspio. Pokušajte ponovo.'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Provjerite e-mail</h1>
          <p className="auth-subtitle">
            Ako račun s ovom e-mail adresom postoji, poslali smo na nju poveznicu za
            resetiranje lozinke.
          </p>
          <p className="auth-footer">
            <Link to="/login">Natrag na prijavu</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Zaboravljena lozinka</h1>
        <p className="auth-subtitle">
          Unesite svoju e-mail adresu i poslat ćemo vam poveznicu za resetiranje lozinke.
        </p>

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

          <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Slanje...' : 'Pošalji poveznicu'}
          </button>
        </form>

        <p className="auth-footer">
          Sjetili ste se lozinke? <Link to="/login">Prijavite se</Link>
        </p>
      </div>
    </div>
  );
}
