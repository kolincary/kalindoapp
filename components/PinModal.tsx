import React, { useState, useEffect } from 'react';
import { Delete, ShieldCheck } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  expectedPin: string;
  accentColor?: 'blue' | 'purple';
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onSuccess, onClose, expectedPin, accentColor = 'blue' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const PIN_LENGTH = 6;

  // Color maps based on accentColor prop
  const colors = {
    blue: {
      leftBg: 'bg-blue-600',
      leftGradient: 'from-blue-600 to-blue-800',
      leftDecor: 'bg-blue-400',
      leftText: 'text-blue-100',
      mobileIcon: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-600 dark:bg-blue-500',
    },
    purple: {
      leftBg: 'bg-purple-700',
      leftGradient: 'from-purple-700 to-violet-800',
      leftDecor: 'bg-purple-400',
      leftText: 'text-purple-100',
      mobileIcon: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
  }[accentColor];

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  // Handle Physical Keyboard Input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pin]);

  const handleNumberClick = (num: string) => {
    setPin(prev => {
      if (prev.length < PIN_LENGTH) {
        const newPin = prev + num;
        setError(false);
        if (newPin.length === PIN_LENGTH) {
          setTimeout(() => validatePin(newPin), 300);
        }
        return newPin;
      }
      return prev;
    });
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const validatePin = (inputPin: string) => {
    if (inputPin === expectedPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal - Wider on Desktop */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-[380px] sm:max-w-md md:max-w-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] my-auto">

        <div className="flex flex-col md:flex-row">

          {/* Desktop Left Side Decor */}
          <div className={`hidden md:flex md:w-1/2 ${colors.leftBg} items-center justify-center p-10 relative overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.leftGradient}`}></div>
            <div className="relative z-10 text-center text-white">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Security Verification</h3>
              <p className={`${colors.leftText} text-sm`}>Please enter your PIN to continue accessing the warehouse system.</p>
            </div>
            {/* Decor Shapes */}
            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className={`absolute bottom-[-20px] right-[-20px] w-40 h-40 ${colors.leftDecor} opacity-20 rounded-full blur-2xl`}></div>
          </div>

          {/* Input Area */}
          <div className="w-full md:w-1/2 pt-6 pb-5 px-4 sm:px-6 flex flex-col items-center justify-center bg-white dark:bg-gray-900">

            {/* Mobile Icon */}
            <div className={`md:hidden w-14 h-14 ${colors.mobileIcon} rounded-2xl flex items-center justify-center mb-3`}>
              <ShieldCheck size={28} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 md:hidden">Enter Security PIN</h3>
            <h3 className="hidden md:block text-xl font-bold text-gray-900 dark:text-white mb-1">User Access</h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center px-4 md:px-0">
              Enter your 6-digit personal code.
            </p>

            {/* PIN Display */}
            <div className="flex gap-2.5 sm:gap-3 mb-3 h-8 items-center justify-center w-full">
              {[...Array(PIN_LENGTH)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-3.5 h-3.5 rounded-full transition-all duration-300
                    ${i < pin.length
                      ? error
                        ? 'bg-red-500 scale-110'
                        : `${colors.dot} scale-110`
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                />
              ))}
            </div>

            {/* Status Message Area */}
            <div className="h-6 mb-2 flex items-center justify-center w-full">
              {error && (
                <p className="text-red-500 text-xs font-bold animate-pulse bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-800">
                  Incorrect PIN.
                </p>
              )}
            </div>

            {/* Custom Numpad */}
            <div className="grid grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3.5 sm:gap-y-4.5 w-full max-w-[280px] sm:max-w-[320px] justify-items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center transition-all active:scale-90 active:bg-blue-100 dark:active:bg-gray-600 shadow-xs hover:shadow-md cursor-pointer select-none"
                >
                  {num}
                </button>
              ))}
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                {/* Empty Placeholder */}
              </div>
              <button
                onClick={() => handleNumberClick('0')}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center transition-all active:scale-90 active:bg-blue-100 dark:active:bg-gray-600 shadow-xs hover:shadow-md cursor-pointer select-none"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all active:scale-90 active:bg-gray-200 dark:active:bg-gray-700 cursor-pointer select-none"
              >
                <Delete size={26} />
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-semibold hover:text-gray-700 dark:hover:text-gray-200 py-1.5 px-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};