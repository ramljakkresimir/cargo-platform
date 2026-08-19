import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';
import Turnstile from '../components/Turnstile';

interface LocationState {
  registeredMessage?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredMessage = (location.state as LocationState | null)?.registeredMessage;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired] = useState(() => {
    const expired = sessionStorage.getItem('sessionExpired') === '1';
    if (expired) sessionStorage.removeItem('sessionExpired');
    return expired;
  });

  // Only requested by the backend after several recent failed attempts on this account —
  // most users logging in normally never see this widget.
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Set when the backend blocks a login because the account's email isn't verified yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendCaptchaToken, setResendCaptchaToken] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
        captchaToken: captchaRequired ? captchaToken : undefined,
      });
      const { access_token, user } = response.data;
      login(access_token, user);
      navigate('/dashboard');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Prijava nije uspjela. Pokušajte ponovo.');
      if (msg.toLowerCase().includes('captcha')) {
        setCaptchaRequired(true);
        setError('Potrebna je dodatna provjera — riješite CAPTCHA izazov ispod i pokušajte ponovo.');
      } else if (msg.toLowerCase().includes('verify your email')) {
        setUnverifiedEmail(email);
        setError('Molimo potvrdite svoju e-mail adresu prije prijave.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendError('');
    if (!resendCaptchaToken || !unverifiedEmail) {
      setResendError('Molimo potvrdite CAPTCHA izazov.');
      return;
    }
    setResendLoading(true);
    try {
      await authService.resendVerification({
        email: unverifiedEmail,
        captchaToken: resendCaptchaToken,
      });
      setResendSent(true);
    } catch (err) {
      setResendError(extractErrorMessage(err, 'Slanje nije uspjelo. Pokušajte ponovo.'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Prijava</h1>
        <p className="auth-subtitle">Dobrodošli natrag na CargoConnect</p>

        {registeredMessage && !error && (
          <div className="alert alert-success">{registeredMessage}</div>
        )}
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

          <div className="auth-links">
            <Link to="/forgot-password">Zaboravili ste lozinku?</Link>
          </div>

          {captchaRequired && (
            <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
          )}

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Prijava u tijeku...' : 'Prijavi se'}
          </button>
        </form>

        {unverifiedEmail && (
          <div className="resend-verification-panel">
            {resendSent ? (
              <p>
                Ako je e-mail adresa ispravna i još nije potvrđena, poslali smo novu
                poveznicu za potvrdu.
              </p>
            ) : (
              <>
                <p>Niste primili e-mail za potvrdu?</p>
                {resendError && <div className="alert alert-error">{resendError}</div>}
                <Turnstile
                  onVerify={setResendCaptchaToken}
                  onExpire={() => setResendCaptchaToken('')}
                />
                <button
                  type="button"
                  className="btn-secondary btn-block"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Slanje...' : 'Pošalji ponovo'}
                </button>
              </>
            )}
          </div>
        )}

        <p className="auth-footer">
          Nemate račun? <Link to="/register">Registrirajte se</Link>
        </p>
      </div>
    </div>
  );
}
