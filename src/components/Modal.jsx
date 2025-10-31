import React from 'react';

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg">&times;</button>
            {children}
        </div>
    </div>
);

export default Modal;
