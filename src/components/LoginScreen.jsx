import React from 'react';
import { User, Stethoscope } from 'lucide-react';

const LoginScreen = ({ handleSelectRole, userId, statusMessage }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-3xl font-extrabold mb-8 text-indigo-700">Welcome to RuralCare</h1>
        <p className="text-gray-600 mb-6 text-center max-w-sm">
            Connect with healthcare professionals easily, wherever you are.
        </p>
        <div className="flex space-x-4">
            <button
                onClick={() => handleSelectRole('patient')}
                className="flex flex-col items-center bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 w-36 h-36 justify-center"
            >
                <User className="w-8 h-8 mb-2" />
                Patient
            </button>
            <button
                onClick={() => handleSelectRole('doctor')}
                className="flex flex-col items-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 w-36 h-36 justify-center"
            >
                <Stethoscope className="w-8 h-8 mb-2" />
                Doctor
            </button>
        </div>
        <p className="mt-6 text-xs text-gray-500">Your User ID: {userId || 'Authenticating...'}</p>
        <p className="mt-2 text-xs text-red-500">{statusMessage}</p>
    </div>
);

export default LoginScreen;
