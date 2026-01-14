'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/students', label: 'Students', icon: 'users' },
  { href: '/admin/parents', label: 'Parents', icon: 'family' },
  { href: '/admin/transactions', label: 'Transactions', icon: 'receipt' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
  { href: '/', label: 'Open Scanner', icon: 'scanner' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isMobile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'users':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      case 'family':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      case 'dollar':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )
      case 'receipt':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
            <path d="M8 10h8" />
            <path d="M8 14h4" />
          </svg>
        )
      case 'settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      case 'scanner':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 012-2h2" />
            <path d="M17 3h2a2 2 0 012 2v2" />
            <path d="M21 17v2a2 2 0 01-2 2h-2" />
            <path d="M7 21H5a2 2 0 01-2-2v-2" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <div className="mobile-header-gold-bar" />
        <div className="mobile-header-content">
          <button
            className={`mobile-menu-toggle ${isOpen ? 'is-open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <Link href="/admin/students" className="mobile-header-logo">
            <Image
              src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
              alt="ACA"
              width={140}
              height={35}
              priority
            />
          </Link>
          <div className="mobile-header-spacer" />
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`nav-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <nav className={`admin-nav ${isOpen ? 'is-open' : ''}`}>
        {/* Gold accent bar like ACA website */}
        <div className="gold-bar" />

        {/* Mobile close button inside nav */}
        <button
          className="mobile-close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="nav-header">
          <Link href="/" className="logo-link" onClick={handleNavClick}>
            <Image
              src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
              alt="Aldersgate Christian Academy"
              width={180}
              height={45}
              className="logo-image"
              priority
            />
          </Link>
        </div>

        <div className="add-payment-section">
          <Link href="/admin/add-payment" className="add-payment-btn" onClick={handleNavClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Payment
          </Link>
        </div>

        <div className="nav-section">
          <span className="nav-section-label">Menu</span>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-icon">{getIcon(item.icon)}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-footer">
          <button onClick={() => { handleLogout(); handleNavClick(); }} className="nav-link logout-btn">
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>

        <style jsx>{`
          /* Mobile Header Bar */
          .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            z-index: 150;
            background: #002c5f;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          }

          .mobile-header-gold-bar {
            height: 3px;
            width: 100%;
            background: linear-gradient(90deg, #d4af37 0%, #ffe082 50%, #d4af37 100%);
          }

          .mobile-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            gap: 12px;
            height: 56px;
            box-sizing: border-box;
          }

          .mobile-header-logo {
            display: flex;
            align-items: center;
          }

          .mobile-header-spacer {
            width: 44px;
          }

          /* Mobile Menu Toggle Button */
          .mobile-menu-toggle {
            display: none;
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 10px;
            transition: all 0.2s ease;
          }

          .mobile-menu-toggle:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          .mobile-menu-toggle:active {
            transform: scale(0.95);
          }

          .hamburger-line {
            display: block;
            width: 20px;
            height: 2px;
            background: #d4af37;
            border-radius: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
          }

          .mobile-menu-toggle.is-open .hamburger-line:nth-child(1) {
            transform: translateY(7px) rotate(45deg);
          }

          .mobile-menu-toggle.is-open .hamburger-line:nth-child(2) {
            opacity: 0;
            transform: scaleX(0);
          }

          .mobile-menu-toggle.is-open .hamburger-line:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
          }

          /* Overlay */
          .nav-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 20, 40, 0.7);
            backdrop-filter: blur(4px);
            z-index: 99;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .nav-overlay.is-visible {
            opacity: 1;
            visibility: visible;
          }

          /* Mobile Close Button */
          .mobile-close-btn {
            display: none;
            position: absolute;
            top: 16px;
            right: 16px;
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
            z-index: 10;
          }

          .mobile-close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
          }

          /* Main Navigation */
          .admin-nav {
            width: 260px;
            background: linear-gradient(180deg, #001d3d 0%, #002c5f 100%);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 100;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          }

          .gold-bar {
            height: 4px;
            background: linear-gradient(90deg, #d4af37 0%, #ffe082 50%, #d4af37 100%);
            flex-shrink: 0;
          }

          .nav-header {
            padding: 28px 24px;
          }

          .logo-link {
            display: block;
            text-decoration: none;
            transition: opacity 0.2s ease;
          }

          .logo-link:hover {
            opacity: 0.9;
          }

          :global(.logo-image) {
            opacity: 1;
          }

          .add-payment-section {
            padding: 16px 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .add-payment-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            width: 100% !important;
            padding: 12px 16px !important;
            background: #d4af37 !important;
            color: #002c5f !important;
            border: none !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3) !important;
          }

          .add-payment-btn:hover {
            background: #e6c54a !important;
            color: #002c5f !important;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4) !important;
            transform: translateY(-1px) !important;
          }

          .add-payment-btn:active {
            transform: translateY(0) !important;
          }

          .add-payment-btn svg {
            flex-shrink: 0 !important;
            stroke: #002c5f !important;
          }

          .nav-section {
            flex: 1;
            padding: 24px 0;
            overflow-y: auto;
          }

          .nav-section-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: rgba(255, 255, 255, 0.35);
            padding: 0 24px 16px;
          }

          .nav-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 0 12px;
          }

          .nav-link {
            position: relative;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
            line-height: 1;
            transition: all 0.15s ease;
            border: none;
            background: transparent;
            width: 100%;
            cursor: pointer;
            font-family: var(--font-body);
            box-sizing: border-box;
            text-align: left;
          }

          .nav-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            margin-right: 12px;
          }

          .nav-icon :global(svg) {
            display: block;
            width: 20px;
            height: 20px;
          }

          .nav-label {
            flex: 1;
          }

          .nav-link:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }

          .nav-link.active {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            font-weight: 600;
          }

          .nav-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            background: #d4af37;
            border-radius: 0 2px 2px 0;
          }

          .nav-footer {
            padding: 16px 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .logout-btn {
            color: rgba(255, 255, 255, 0.5);
          }

          .logout-btn:hover {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
          }

          /* Mobile Styles */
          @media (max-width: 767px) {
            .mobile-header {
              display: flex !important;
              flex-direction: column;
              height: auto;
              min-height: 59px;
              visibility: visible !important;
              opacity: 1 !important;
            }

            .mobile-header-gold-bar {
              display: block !important;
              height: 4px !important;
              min-height: 4px !important;
              width: 100% !important;
              background: linear-gradient(90deg, #d4af37 0%, #ffe082 50%, #d4af37 100%) !important;
            }

            .mobile-header-content {
              display: flex !important;
              height: 56px !important;
            }

            .mobile-menu-toggle {
              display: flex !important;
            }

            .nav-overlay {
              display: block;
              top: 0;
            }

            .mobile-close-btn {
              display: flex;
            }

            .admin-nav {
              position: fixed;
              left: 0;
              top: 0;
              width: 280px;
              max-width: 85vw;
              height: 100vh;
              height: 100dvh;
              transform: translateX(-100%);
              transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
              visibility: hidden;
            }

            .admin-nav.is-open {
              transform: translateX(0);
              box-shadow: 8px 0 40px rgba(0, 0, 0, 0.3);
              visibility: visible;
            }

            .nav-header {
              padding: 24px 20px;
              padding-top: 20px;
            }

            .add-payment-section {
              padding: 12px 14px 16px;
            }

            .nav-section {
              padding: 20px 0;
            }

            .nav-section-label {
              padding: 0 20px 12px;
            }

            .nav-links {
              padding: 0 10px;
            }

            .nav-link {
              padding: 12px 14px;
            }

            .nav-footer {
              padding: 14px 10px 24px;
            }
          }
        `}</style>
      </nav>
    </>
  )
}
