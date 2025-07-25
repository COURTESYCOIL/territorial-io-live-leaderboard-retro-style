
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="bg-blue-900/70 p-1 border-2 border-t-gray-300 border-l-gray-300 border-b-gray-600 border-r-gray-600">
        <div className="p-6 border-2 border-t-gray-600 border-l-gray-600 border-b-gray-300 border-r-gray-300 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-2xl font-semibold text-red-500">SYSTEM ERROR</h3>
            <p className="text-yellow-300 mt-2 max-w-md text-lg">{message}</p>
        </div>
    </div>
  );
};

export default ErrorDisplay;