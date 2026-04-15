import { useEffect, useState, useRef } from 'react';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;

    // Show new message
    setDisplayedMessage(message);
    setVisible(true);

    // Clear any existing dismiss timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Dismiss after 3 seconds
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message]);

  if (!displayedMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'px-5 py-3 rounded-lg shadow-lg',
        'bg-gray-900/90 text-white text-sm font-medium',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {displayedMessage}
    </div>
  );
}
