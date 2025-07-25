
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="text-2xl text-cyan-300 animate-pulse">
        LOADING DATA...
      </div>
    </div>
  );
};

export default LoadingSpinner;