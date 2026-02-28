import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        if (token && user) {
            try { setAuth({ token, ...JSON.parse(user) }) }
            catch { localStorage.clear() }
        }
        setLoading(false)
    }, [])

    const login = (token, user) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setAuth({ token, ...user })
    }

    const logout = () => {
        localStorage.clear()
        setAuth(null)
    }

    if (loading) return null

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
