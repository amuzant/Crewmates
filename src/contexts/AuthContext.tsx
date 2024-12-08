'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface AuthContextType {
  refreshAuth: () => void
  authVersion: number
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authVersion, setAuthVersion] = useState(0)

  const refreshAuth = useCallback(() => {
    setAuthVersion(v => v + 1)
  }, [])

  return (
    <AuthContext.Provider value={{ refreshAuth, authVersion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 