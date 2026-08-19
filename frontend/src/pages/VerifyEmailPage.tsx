import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorUtils';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState('');

  const verify = async () => {
    try {
      await authService.verifyEmail(token);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setMessage(extractErrorMessage(err, 'Poveznica za potvrdu nije ispravna ili je istekla.'));
    }
  };

  useEffect(() => {
    if (!token) return;
    // Data fetching over the network — the setState calls in verify's
    // then/catch are the async result of this effect, not derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'verifying' && (
          <>
            <h1>Potvrđivanje e-mail adrese...</h1>
            <p className="auth-subtitle">Pričekajte trenutak.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>E-mail adresa potvrđena</h1>
            <p className="auth-subtitle">Sada se možete prijaviti na svoj račun.</p>
            <Link to="/login" className="btn-primary btn-block auth-cta-link">
              Prijavi se
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Potvrda nije uspjela</h1>
            <div className="alert alert-error">
              {message || 'Poveznica za potvrdu nije ispravna ili je istekla.'}
            </div>
            <p className="auth-footer">
              <Link to="/login">Natrag na prijavu</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
