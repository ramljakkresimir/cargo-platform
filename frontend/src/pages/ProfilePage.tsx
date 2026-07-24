import { useState, FormEvent } from 'react';
import { usersService } from '../services/users.service';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';

export default function ProfilePage() {
  const { user, login, token } = useAuth();

  // ── Personal Information ─────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ── Change Password ──────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Pre-fill profile form from auth context. Adjusted during render (React's
  // recommended pattern for "reset state when a prop changes") rather than in
  // an effect, so the form never paints with stale/empty values first.
  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    setProfileForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
    });
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const payload: Record<string, string> = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      };
      if (profileForm.phone) payload.phone = profileForm.phone;

      const res = await usersService.updateProfile(payload);

      // Update the auth context so Navbar and other components reflect the change immediately
      if (token) {
        login(token, {
          id: res.data.id,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone,
          role: res.data.role,
        });
      }

      setProfileSuccess('Profil je uspješno ažuriran.');
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Spremanje profila nije uspjelo.'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Nove lozinke se ne podudaraju.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Nova lozinka mora imati najmanje 6 znakova.');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Lozinka je uspješno promijenjena.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Promjena lozinke nije uspjela.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Moj profil</h1>
          <p className="page-subtitle">Upravljajte osobnim podacima i lozinkom</p>
        </div>
      </div>

      {/* ── Personal Information ─────────────────────────────────── */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <h2>Osobni podaci</h2>

        {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
        {profileError && <div className="alert alert-error">{profileError}</div>}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Ime *</label>
              <input
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Prezime *</label>
              <input
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telefon</label>
              <input
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="npr. +387 61 123 456"
              />
            </div>
            <div className="form-group">
              <label>E-mail <span className="hint">(nije moguće promijeniti)</span></label>
              <input value={user?.email ?? ''} disabled />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Spremanje...' : 'Spremi promjene'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password ──────────────────────────────────────── */}
      <div className="form-card">
        <h2>Promjena lozinke</h2>

        {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
        {passwordError && <div className="alert alert-error">{passwordError}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group" style={{ maxWidth: 400 }}>
            <label>Trenutna lozinka *</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="form-row" style={{ maxWidth: 640 }}>
            <div className="form-group">
              <label>Nova lozinka *</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Najmanje 6 znakova"
                required
              />
            </div>
            <div className="form-group">
              <label>Potvrdite novu lozinku *</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Mijenjanje...' : 'Promijeni lozinku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
