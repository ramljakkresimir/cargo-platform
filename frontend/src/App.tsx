import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import CreateCargoPostPage from './pages/CreateCargoPostPage';
import CreateVehiclePostPage from './pages/CreateVehiclePostPage';
import CargoListPage from './pages/CargoListPage';
import VehicleListPage from './pages/VehicleListPage';
import CargoDetailPage from './pages/CargoDetailPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import MyPostsPage from './pages/MyPostsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cargo" element={<CargoListPage />} />
            <Route path="/cargo/:id" element={<CargoDetailPage />} />
            <Route path="/vehicles" element={<VehicleListPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

            {/* Protected routes — require login */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/company" element={
              <ProtectedRoute><CompanyProfilePage /></ProtectedRoute>
            } />
            <Route path="/cargo/new" element={
              <ProtectedRoute><CreateCargoPostPage /></ProtectedRoute>
            } />
            <Route path="/vehicles/new" element={
              <ProtectedRoute><CreateVehiclePostPage /></ProtectedRoute>
            } />
            <Route path="/my-posts" element={
              <ProtectedRoute><MyPostsPage /></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/cargo" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
