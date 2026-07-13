import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

// Wraps any page that requires authentication.
// If the user is not logged in, redirect them to /login instead of showing the page.
export default function ProtectedRoute({ children }: Props) {
  const { token, isLoading } = useAuth();

  // While we're reading the token from localStorage, show nothing to avoid flash
  if (isLoading) {
    return <div className="loading">Učitavanje...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
