import React, { useRef } from 'react';

export const OtpInput = ({ length = 6, value = '', onChange }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;

    // Grab the last typed character if multiple characters entered
    const char = val.slice(-1);
    const otpArray = value.split('');
    while (otpArray.length < length) otpArray.push('');
    otpArray[index] = char;
    const newOtp = otpArray.join('').slice(0, length);
    onChange(newOtp);

    // Auto-focus next input
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const otpArray = value.split('');
      if (otpArray[index]) {
        otpArray[index] = '';
        onChange(otpArray.join(''));
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        otpArray[index - 1] = '';
        onChange(otpArray.join(''));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="otp-grid">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="otp-cell"
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};
