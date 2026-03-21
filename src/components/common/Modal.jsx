import { useState, useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setShow(true));
        } else {
            setShow(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }[size];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200
          ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            {/* Modal Content */}
            <div
                className={`relative w-full ${sizeClass} bg-surface-800 border border-surface-700
          rounded-t-3xl sm:rounded-2xl shadow-2xl transform transition-all duration-300
          ${show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
                {/* Handle bar for mobile */}
                <div className="flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 bg-surface-600 rounded-full" />
                </div>
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-surface-700 hover:bg-surface-600
                flex items-center justify-center text-surface-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {/* Body */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
