import { Navigate, Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Mientras verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b7c45]"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si está autenticado, renderizar el layout con el contenido
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}