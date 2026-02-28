import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

// Public
import LandingPage from './pages/LandingPage.jsx'
import CitizenAuthPage from './pages/auth/CitizenAuthPage.jsx'
import KabadiAuthPage from './pages/auth/KabadiAuthPage.jsx'

// Citizen
import CitizenDashboard from './pages/citizen/CitizenDashboard.jsx'
import CitizenProfile from './pages/citizen/CitizenProfile.jsx'
import CitizenBookings from './pages/citizen/CitizenBookings.jsx'
import BookPickup from './pages/citizen/BookPickup.jsx'
import FindKabadi from './pages/citizen/FindKabadi.jsx'

// Kabadi
import KabadiDashboard from './pages/kabadi/KabadiDashboard.jsx'
import KabadiProfile from './pages/kabadi/KabadiProfile.jsx'
import LogTransaction from './pages/kabadi/LogTransaction.jsx'

// Admin
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth/citizen" element={<CitizenAuthPage />} />
                    <Route path="/auth/kabadi" element={<KabadiAuthPage />} />
                    <Route path="/admin" element={<AdminLogin />} />

                    {/* Citizen routes */}
                    <Route path="/citizen/dashboard" element={<PrivateRoute userType="CITIZEN"><CitizenDashboard /></PrivateRoute>} />
                    <Route path="/citizen/profile" element={<PrivateRoute userType="CITIZEN"><CitizenProfile /></PrivateRoute>} />
                    <Route path="/citizen/bookings" element={<PrivateRoute userType="CITIZEN"><CitizenBookings /></PrivateRoute>} />
                    <Route path="/citizen/book-pickup" element={<PrivateRoute userType="CITIZEN"><BookPickup /></PrivateRoute>} />
                    <Route path="/citizen/find-kabadi" element={<PrivateRoute userType="CITIZEN"><FindKabadi /></PrivateRoute>} />

                    {/* Kabadi routes */}
                    <Route path="/kabadi/dashboard" element={<PrivateRoute userType="KABADI"><KabadiDashboard /></PrivateRoute>} />
                    <Route path="/kabadi/profile" element={<PrivateRoute userType="KABADI"><KabadiProfile /></PrivateRoute>} />
                    <Route path="/kabadi/log-transaction" element={<PrivateRoute userType="KABADI"><LogTransaction /></PrivateRoute>} />

                    {/* Admin routes */}
                    <Route path="/admin/dashboard" element={<PrivateRoute userType="ADMIN"><AdminDashboard /></PrivateRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
