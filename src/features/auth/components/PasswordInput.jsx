import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = ({ id, value, onChange, placeholder = '••••••••', error, name = 'password', autoFocus = false }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-input-wrapper">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        className={`auth-input ${error ? 'has-error' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="current-password"
      />
      <button
        type="button"
        className="auth-input-icon"
        onClick={() => setShow((prev) => !prev)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
