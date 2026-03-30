import React, { useEffect, useState } from 'react';

// ============================================================================
// TOAST NOTIFICATION - Reusable notification component for both user & admin
// ============================================================================

const Toast = ({ message, type = 'success', onClose, visible = true }) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (!visible) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible, onClose]);

  // Determine colors and icons based on type
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-green-700',
          text: 'text-white',
          icon: '✓',
          iconBg: 'bg-green-700',
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-red-700',
          text: 'text-white',
          icon: '✕',
          iconBg: 'bg-red-700',
        };
      default:
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-700',
          text: 'text-white',
          icon: 'ℹ',
          iconBg: 'bg-blue-700',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 ${styles.bg} rounded-lg shadow-lg flex items-center gap-3 px-4 py-3 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${styles.iconBg} flex-shrink-0`}
      >
        <span className="text-sm font-bold text-white">{styles.icon}</span>
      </div>
      <span className={`text-sm font-medium ${styles.text}`}>{message}</span>
    </div>
  );
};

export default Toast;
