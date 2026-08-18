import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Učitavanje...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="empty-state empty-state-alert">
          <h2 className="empty-state-alert-title">Pristup odbijen</h2>
          <p>Nemate dozvolu za pristup ovoj stranici.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
