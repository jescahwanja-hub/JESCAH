import React, { useState, useEffect } from 'react';
import ArticleIcon from './icons/ArticleIcon';
import CopyIcon from './icons/CopyIcon';

interface ArticleDisplayProps {
  article: string | null;
  isLoading: boolean;
  error: string | null;
}

const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, isLoading, error }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = () => {
        if (!article) return;
        navigator.clipboard.writeText(article);
        setCopied(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 h-64">
                    <div className="w-12 h-12 border-4 border-t-transparent border-green-600 rounded-full animate-spin"></div>
                    <p className="text-lg text-gray-600 animate-pulse">Writing your article...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-4 text-center bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <p><strong>Article Generation Failed:</strong> {error}</p>
                </div>
            );
        }

        if (article) {
            const titleMatch = article.match(/^(.+)\n/);
            const title = titleMatch ? titleMatch[1] : 'Generated Article';
            const content = titleMatch ? article.substring(titleMatch[0].length) : article;
            
            return (
                <>
                    <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <span className="text-green-600"><ArticleIcon className="w-6 h-6"/></span>
                            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        </div>
                        <button
                            onClick={handleCopy}
                            title="Copy Article"
                            className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors duration-200 ${
                                copied
                                ? 'bg-green-600 text-white'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        >
                            <CopyIcon className="w-4 h-4" />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="p-6">
                        <pre className="whitespace-pre-wrap font-sans text-gray-700 text-base leading-relaxed">{content}</pre>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition-all duration-300">
            {renderContent()}
        </div>
    );
};

export default ArticleDisplay;
