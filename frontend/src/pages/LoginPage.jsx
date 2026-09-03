import React, { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, ArrowRight, Globe } from 'lucide-react'
import logoImg from '../assets/logo.png'
import '../styles/LoginPage.css'

export default function LoginPage({ onLoginSuccess, language = 'hi', onToggleLanguage }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [autofilledMsg, setAutofilledMsg] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isHindi = language === 'hi'

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError(
        isHindi
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : 'Please enter both email and password.'
      )
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (onLoginSuccess) {
        onLoginSuccess({ email, role: 'Farmer User' })
      }
    }, 600)
  }

  const handleAutofillDemo = () => {
    setEmail('farmer1@farmhawk.com')
    setPassword('password123')
    setError('')
    setAutofilledMsg(true)
    setTimeout(() => setAutofilledMsg(false), 3000)
  }

  return (
    <div className="login-page-wrapper">
      {/* Top Navigation Bar with Language Selection on Login Page */}
      <header className="login-header-bar">
        <div className="login-header-brand">
          <img src={logoImg} alt="FarmHawk Logo" className="login-header-logo" />
        </div>
        <button onClick={onToggleLanguage} className="login-lang-btn">
          <Globe size={18} />
          <span>{isHindi ? 'English' : 'हिन्दी'}</span>
        </button>
      </header>

      <div className="login-container">
        <div className="login-card">
          {/* Card Logo Header */}
          <div className="brand-header">
            <img src={logoImg} alt="FarmHawk Logo" className="brand-logo-img" />
            <p className="brand-tagline">
              {isHindi
                ? 'आधुनिक खेती के लिए सटीक ड्रोन निगरानी'
                : 'Precision Drone Monitoring for Modern Agriculture'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && <div className="error-alert">{error}</div>}
          {autofilledMsg && (
            <div className="success-alert" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {isHindi
                ? 'डेमो क्रेडेंशियल्स दर्ज कर दिए गए हैं!'
                : 'Demo credentials filled!'}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {isHindi ? 'ईमेल' : 'Email Address'}
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {isHindi ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{isHindi ? 'मुझे याद रखें' : 'Remember Me'}</span>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading
                ? isHindi ? 'साइन इन हो रहा है...' : 'Signing in...'
                : isHindi ? 'साइन इन करें' : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div
            className="demo-credentials-box"
            onClick={handleAutofillDemo}
            title={isHindi ? 'क्लिक करके ऑटो-फिल करें' : 'Click to auto-fill credentials'}
          >
            <div className="demo-title">
              <span>Demo Credentials:</span>
              <span className="autofill-badge">
                {isHindi ? 'क्लिक करें' : 'Click to fill'}
              </span>
            </div>
            <div className="demo-detail">
              <strong>Email:</strong> farmer1@farmhawk.com
            </div>
            <div className="demo-detail">
              <strong>Password:</strong> password123
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
