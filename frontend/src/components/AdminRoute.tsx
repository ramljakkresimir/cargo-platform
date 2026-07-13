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
        <div className="empty-state" style={{ marginTop: 60 }}>
          <h2 style={{ marginBottom: 8, color: '#dc2626' }}>Pristup odbijen</h2>
          <p>Nemate dozvolu za pristup ovoj stranici.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
