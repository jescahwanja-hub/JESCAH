import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600 animate-pulse">Crafting your posts...</p>
        </div>
    );
}

export default Loader;