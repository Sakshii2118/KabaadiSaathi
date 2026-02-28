import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PrivateRoute({ children, userType }) {
    const { auth } = useAuth()
    if (!auth || !auth.token) return <Navigate to="/" replace />
    if (userType && auth.userType !== userType) return <Navigate to="/" replace />
    return children
}
