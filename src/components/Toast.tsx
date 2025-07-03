import React, { useEffect } from 'react';
import '../styles/global.css';

interface ToastProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  actionText,
  onAction,
  onClose,
  duration = 5000,
  isVisible,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="toast">
      <div className="toast__content">
        <span className="toast__message">{message}</span>
        <div className="toast__actions">
          {actionText && onAction && (
            <button className="toast__action-btn" onClick={onAction}>
              {actionText}
            </button>
          )}
          <button className="toast__close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
