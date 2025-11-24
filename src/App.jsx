import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'
import { ThemeProvider } from './components/ui/theme-provider'
import UsersListPage from './pages/UsersList'
import ProductsListPage from './pages/ProductsList'
import ProductOutputsListPage from './pages/ProductOutputsList'
import SuppliersListPage from './pages/SupplierList'
import PigsListPage from './pages/PigsList'
import SowReproductiveHistoryPage from './pages/SowReproductiveHistory'
import SowPigletsPage from './pages/SowPiglets'
import SowRegistrationPage from './pages/SowRegistration'
import BoarRegistrationPage from './pages/BoarRegistration'
import ReproductiveListPage from './pages/ReproductiveList'
import HeatsListPage from './pages/HeatsList'
import HeatRegistrationPage from './pages/HeatRegistration'
import ServicesListPage from './pages/ServicesList'
import ServiceRegistrationPage from './pages/ServiceRegistration'
import PregnanciesListPage from './pages/PregnanciesList'
import PregnancyRegistrationPage from './pages/PregnancyRegistration'
import BirthsListPage from './pages/BirthsList'
import BirthRegistrationPage from './pages/BirthRegistration'
import AbortionsListPage from './pages/AbortionsList'
import AbortionRegistrationPage from './pages/AbortionRegistration'
import PigletRegistrationPage from './pages/PigletRegistration'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import Dashboard from './pages/Dashboard'
import MyAccountPage from './pages/MyAccount'
import { Toaster } from './components/ui/toaster'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Rutas protegidas dentro del layout principal */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/product-outputs" element={<ProductOutputsListPage />} />
            <Route path="/suppliers" element={<SuppliersListPage/>} />
            <Route path="/sows" element={<Navigate to="/sows/list" replace />} />
            <Route path="/sows/register" element={<SowRegistrationPage />} />
            <Route path="/sows/edit/:id" element={<SowRegistrationPage />} />
            <Route path="/sows/list" element={<ReproductiveListPage />} />
            <Route path="/sows/reproductive-history" element={<SowReproductiveHistoryPage />} />
            <Route path="/sows/piglets" element={<SowPigletsPage />} />
            <Route path="/boars/register" element={<BoarRegistrationPage />} />
            <Route path="/boars/edit/:id" element={<BoarRegistrationPage />} />
            <Route path="/heats" element={<HeatsListPage />} />
            <Route path="/heats/register" element={<HeatRegistrationPage />} />
            <Route path="/heats/edit/:id" element={<HeatRegistrationPage />} />
            <Route path="/services" element={<ServicesListPage />} />
            <Route path="/services/register" element={<ServiceRegistrationPage />} />
            <Route path="/services/edit/:id" element={<ServiceRegistrationPage />} />
            <Route path="/pregnancies" element={<PregnanciesListPage />} />
            <Route path="/pregnancies/register" element={<PregnancyRegistrationPage />} />
            <Route path="/pregnancies/edit/:id" element={<PregnancyRegistrationPage />} />
            <Route path="/births" element={<BirthsListPage />} />
            <Route path="/births/register" element={<BirthRegistrationPage />} />
            <Route path="/births/edit/:id" element={<BirthRegistrationPage />} />
          <Route path="/abortions" element={<AbortionsListPage />} />
          <Route path="/abortions/register" element={<AbortionRegistrationPage />} />
          <Route path="/abortions/edit/:id" element={<AbortionRegistrationPage />} />
          <Route path="/piglets/register" element={<PigletRegistrationPage />} />
          <Route path="/piglets/edit/:id" element={<PigletRegistrationPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/pigs" element={<PigsListPage />} />
            <Route path="/profile" element={<MyAccountPage />} />
            <Route path="/employees" element={<div>Gestión de Empleados</div>} />
            <Route path="/inventory" element={<div>Gestión de Inventario</div>} />
        
          </Route>
          
          {/* Redirigir cualquier ruta desconocida a dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App