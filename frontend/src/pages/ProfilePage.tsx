import { useState, useEffect, FormEvent } from 'react';
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

  // Pre-fill profile form from auth context on mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
      });
    }
  }, [user]);

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

      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Failed to update profile.'));
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
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Failed to change password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Manage your personal information and password
          </p>
        </div>
      </div>

      {/* ── Personal Information ─────────────────────────────────── */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <h2>Personal Information</h2>

        {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
        {profileError && <div className="alert alert-error">{profileError}</div>}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
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
              <label>Phone</label>
              <input
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="e.g. +387 61 123 456"
              />
            </div>
            <div className="form-group">
              <label>Email <span className="hint">(cannot be changed)</span></label>
              <input value={user?.email ?? ''} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password ──────────────────────────────────────── */}
      <div className="form-card">
        <h2>Change Password</h2>

        {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
        {passwordError && <div className="alert alert-error">{passwordError}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group" style={{ maxWidth: 400 }}>
            <label>Current Password *</label>
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
              <label>New Password *</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
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
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
