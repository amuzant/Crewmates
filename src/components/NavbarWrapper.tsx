'use client'
import { Navbar } from './Navbar'

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
} 