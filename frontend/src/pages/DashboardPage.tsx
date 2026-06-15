import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>My Company</h3>
          <p>Create or manage your company profile so you can publish posts.</p>
          <Link to="/company" className="btn-secondary">Manage Company</Link>
        </div>

        <div className="dashboard-card">
          <h3>Post Cargo</h3>
          <p>Have cargo that needs transport? Publish a post to find carriers.</p>
          <Link to="/cargo/new" className="btn-secondary">Post Cargo</Link>
        </div>

        <div className="dashboard-card">
          <h3>Post Vehicle</h3>
          <p>Have an available vehicle? Publish its capacity to find freight.</p>
          <Link to="/vehicles/new" className="btn-secondary">Post Vehicle</Link>
        </div>

        <div className="dashboard-card">
          <h3>My Posts</h3>
          <p>View, edit, or delete all cargo and vehicle posts you have published.</p>
          <Link to="/my-posts" className="btn-secondary">My Posts</Link>
        </div>

        <div className="dashboard-card">
          <h3>My Profile</h3>
          <p>Update your name, phone number, or change your password.</p>
          <Link to="/profile" className="btn-secondary">Edit Profile</Link>
        </div>

        <div className="dashboard-card">
          <h3>Browse Cargo</h3>
          <p>Search for cargo posts from companies looking for transport.</p>
          <Link to="/cargo" className="btn-secondary">Browse Cargo</Link>
        </div>

        <div className="dashboard-card">
          <h3>Browse Vehicles</h3>
          <p>Search for available vehicles and truck capacity.</p>
          <Link to="/vehicles" className="btn-secondary">Browse Vehicles</Link>
        </div>
      </div>
    </div>
  );
}
