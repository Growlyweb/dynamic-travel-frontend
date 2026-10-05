import React from 'react';
import '../auth.css';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-root">
      {/* Background Mixed Company Color Shapes (Blue #0879E8 & Gold #FFB000) */}
      <div className="auth-bg-shape-1" aria-hidden="true" />
      <div className="auth-bg-shape-2" aria-hidden="true" />
      <div className="auth-bg-shape-3" aria-hidden="true" />

      <svg className="auth-bg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0879E8" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#FFB000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0879E8" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path fill="url(#bgGrad1)" d="M0,160L80,186.7C160,213,320,267,480,266.7C640,267,800,213,960,202.7C1120,192,1280,224,1360,240L1440,256L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
      </svg>

      <div className="auth-card">
        {/* Company Logo from public folder - ONLY show logo */}
        <div className="auth-logo-wrapper">
          <img
            src="/company_logo.png"
            alt="Company Logo"
            className="auth-company-logo"
          />
        </div>

        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}

        {children}
      </div>
    </div>
  );
};
