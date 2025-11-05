import { useEffect, useState } from 'react';
import { ErrorHandler, ErrorNotification as ErrorNotificationType } from '../utils/errorHandler';
import './ErrorNotification.css';

export function ErrorNotification() {
  const [notifications, setNotifications] = useState<Array<ErrorNotificationType & { id: number }>>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const unsubscribe = ErrorHandler.subscribe((notification) => {
      const id = nextId;
      setNextId(prev => prev + 1);
      
      setNotifications(prev => [...prev, { ...notification, id }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    });

    return unsubscribe;
  }, [nextId]);

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => dismissNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'error' && '❌'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && '✅'}
            </span>
            <div className="notification-message">
              <p>{notification.message}</p>
              {notification.details && (
                <pre className="notification-details">
                  {JSON.stringify(notification.details, null, 2)}
                </pre>
              )}
            </div>
            <button className="notification-close" aria-label="Close notification">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
