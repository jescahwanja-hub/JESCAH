import React from 'react';
import { SavedProject } from '../types';
import FolderIcon from './icons/FolderIcon';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import ArticleIcon from './icons/ArticleIcon';
import SparklesIcon from './icons/SparklesIcon';

interface SavedGenerationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: number) => void;
}

const SavedGenerationsSidebar: React.FC<SavedGenerationsSidebarProps> = ({ isOpen, onClose, projects, onLoad, onDelete }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FolderIcon className="w-6 h-6 text-gray-700" />
              <h2 id="sidebar-title" className="text-xl font-bold text-gray-800">Past Projects</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200" aria-label="Close past projects">
              <CloseIcon className="w-6 h-6 text-gray-600" />
            </button>
          </header>
          <div className="flex-grow overflow-y-auto p-4">
            {projects.length > 0 ? (
              <ul className="space-y-3">
                {projects.map(project => (
                  <li key={project.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3 truncate">
                        <span className="font-semibold text-gray-700 truncate">{project.name}</span>
                        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                            {/* FIX: Wrap icons with a span to apply the title attribute for tooltips, as the icon components do not accept a 'title' prop. */}
                            {project.posts && (
                                <span title="Contains Social Posts">
                                    <SparklesIcon className="w-4 h-4" />
                                </span>
                            )}
                            {project.article && (
                                <span title="Contains an Article">
                                    <ArticleIcon className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => onLoad(project)} 
                          className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Load
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                          aria-label={`Delete project ${project.name}`}
                          className="p-2 text-gray-500 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">No Saved Projects</h3>
                <p className="text-sm">Generate some content and click "Save Project" to see it here.</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default SavedGenerationsSidebar;