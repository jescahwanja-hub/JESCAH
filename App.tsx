import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, Tone, GeneratedPosts, Post, SavedProject } from './types';
import { generateSocialPosts, generateArticle, MediaInput } from './services/geminiService';
import PostCard from './components/PostCard';
import Loader from './components/Loader';
import ArticleDisplay from './components/ArticleDisplay';
import SavedGenerationsSidebar from './components/SavedGenerationsSidebar';

import LinkedInIcon from './components/icons/LinkedInIcon';
import TwitterIcon from './components/icons/TwitterIcon';
import RedditIcon from './components/icons/RedditIcon';
import InstagramIcon from './components/icons/InstagramIcon';
import YouTubeIcon from './components/icons/YouTubeIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import UploadIcon from './components/icons/UploadIcon';
import TextIcon from './components/icons/TextIcon';
import FolderIcon from './components/icons/FolderIcon';
import SaveIcon from './components/icons/SaveIcon';
import ArticleIcon from './components/icons/ArticleIcon';
import LightbulbIcon from './components/icons/LightbulbIcon';

const platformIcons: Record<string, React.ReactNode> = {
  [Platform.LinkedIn]: <LinkedInIcon className="w-6 h-6" />,
  [Platform.Twitter]: <TwitterIcon className="w-6 h-6" />,
  [Platform.Reddit]: <RedditIcon className="w-6 h-6" />,
  [Platform.Instagram]: <InstagramIcon className="w-6 h-6" />,
  [Platform.YouTube]: <YouTubeIcon className="w-6 h-6" />,
  [Platform.ScriptIdeas]: <LightbulbIcon className="w-6 h-6" />,
};

const App: React.FC = () => {
  const [inputType, setInputType] = useState<'url' | 'video' | 'text'>('url');
  const [url, setUrl] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notepadContent, setNotepadContent] = useState<string>('');
  const [tones, setTones] = useState<Record<string, Tone>>({
    [Platform.LinkedIn]: Tone.Professional,
    [Platform.Twitter]: Tone.Witty,
    [Platform.Reddit]: Tone.Casual,
    [Platform.Instagram]: Tone.Inspirational,
    [Platform.YouTube]: Tone.Authoritative,
    [Platform.ScriptIdeas]: Tone.Creative,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPosts | null>(null);
  const [editablePosts, setEditablePosts] = useState<GeneratedPosts | null>(null);

  const [isArticleLoading, setIsArticleLoading] = useState<boolean>(false);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(500);

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('contentCraftProjects');
      if (storedProjects) {
        setSavedProjects(JSON.parse(storedProjects));
      }
    } catch (e) {
      console.error("Failed to parse saved projects from localStorage", e);
      localStorage.removeItem('contentCraftProjects');
    }
  }, []);

  const saveProjectsToStorage = (projects: SavedProject[]) => {
    localStorage.setItem('contentCraftProjects', JSON.stringify(projects));
  };

  const handleSaveProject = () => {
    if (!editablePosts && !generatedArticle) {
      alert("There is no content to save.");
      return;
    }
    const projectName = prompt("Enter a name for this project:", `Project ${new Date().toLocaleDateString()}`);
    if (projectName) {
      const newProject: SavedProject = {
        name: projectName,
        posts: editablePosts || undefined,
        article: generatedArticle || undefined,
        id: Date.now(),
      };
      const updatedProjects = [...savedProjects, newProject];
      setSavedProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
      alert(`Project "${projectName}" saved!`);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setGeneratedPosts(project.posts || null);
    setEditablePosts(project.posts || null);
    setGeneratedArticle(project.article || null);
    setArticleError(null);
    setError(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteProject = (projectId: number) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      const updatedProjects = savedProjects.filter(s => s.id !== projectId);
      setSavedProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
    }
  };

  const handleContentChange = useCallback((platform: Platform, newContent: Post) => {
    setEditablePosts(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [platform]: newContent,
        };
    });
  }, []);

  const handleToneChange = (platform: Platform, newTone: Tone) => {
    setTones(prev => ({
        ...prev,
        [platform]: newTone,
    }));
  };

  const getSource = async (): Promise<string | MediaInput | null> => {
      if (inputType === 'url' && url) return url;
      if (inputType === 'text' && notepadContent) return notepadContent;
      if (inputType === 'video' && videoFile) {
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(videoFile);
        });
        return { mimeType: videoFile.type, data: base64Data };
      }
      return null;
  }

  const handleGeneratePosts = async () => {
    const source = await getSource();
    if (!source) {
      setError('Please provide a source (URL, video, or text).');
      return;
    }
    setError(null);
    setArticleError(null);
    setGeneratedArticle(null);
    setIsLoading(true);
    setGeneratedPosts(null);
    setEditablePosts(null);

    try {
      const posts = await generateSocialPosts(source, tones);
      setGeneratedPosts(posts);
      setEditablePosts(posts);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    const source = await getSource();
    if (!source) {
        setArticleError('Please provide a source (URL, video, or text) before generating an article.');
        return;
    }
    setArticleError(null);
    setError(null);
    setIsArticleLoading(true);
    setGeneratedArticle(null);

    try {
        const article = await generateArticle(source, wordCount);
        setGeneratedArticle(article);
    } catch (err: any) {
        setArticleError(err.message || 'An unknown error occurred while generating the article.');
    } finally {
        setIsArticleLoading(false);
    }
  };
  
  const isUrlValid = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const isSourceProvided = useMemo(() => {
    if (inputType === 'url') return isUrlValid(url);
    if (inputType === 'video') return !!videoFile;
    if (inputType === 'text') return notepadContent.trim().length > 5;
    return false;
  }, [inputType, url, videoFile, notepadContent]);

  const isAnythingGenerated = !!editablePosts || !!generatedArticle;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans p-4 sm:p-6 md:p-8">
      <SavedGenerationsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={savedProjects}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
      />
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <SparklesIcon className="w-8 h-8 text-blue-600"/>
              <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600">
                ContentCraft AI
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Generate social media posts and articles from any source in seconds.
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            title="View Past Projects"
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-gray-700 rounded-lg shadow-md hover:bg-gray-800 transition-all"
          >
            <FolderIcon className="w-5 h-5"/>
            Past Projects
          </button>
        </header>

        <main>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Provide Content Source</h2>
                  <div className="mb-4 flex border-b border-gray-200">
                      <button type="button" onClick={() => setInputType('url')} className={`px-4 py-3 font-semibold text-sm -mb-px border-b-2 flex items-center gap-2 ${inputType === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                          From URL
                      </button>
                      <button type="button" onClick={() => setInputType('video')} className={`px-4 py-3 font-semibold text-sm -mb-px border-b-2 flex items-center gap-2 ${inputType === 'video' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                          From Video
                      </button>
                      <button type="button" onClick={() => setInputType('text')} className={`px-4 py-3 font-semibold text-sm -mb-px border-b-2 flex items-center gap-2 ${inputType === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                          <TextIcon className="w-4 h-4" /> Notepad
                      </button>
                  </div>

                  {inputType === 'url' && (
                      <input id="url-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  )}
                  {inputType === 'video' && (
                      <label htmlFor="video-upload" className="w-full p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center cursor-pointer text-center min-h-[54px]">
                          <input id="video-upload" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} className="sr-only"/>
                          {videoFile ? <span className="text-sm font-semibold text-blue-700">{videoFile.name}</span> : <div className="flex items-center gap-2 text-gray-500"><UploadIcon className="w-5 h-5" /><span>Choose a video file</span></div>}
                      </label>
                  )}
                  {inputType === 'text' && (
                      <textarea value={notepadContent} onChange={(e) => setNotepadContent(e.target.value)} placeholder="Paste your article, script, or notes here..." className="w-full px-4 py-3 h-40 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"></textarea>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Customize Tones</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.values(Platform).map(platform => (
                      <div key={platform}>
                        <label htmlFor={`${platform}-tone-select`} className="block text-sm font-medium text-gray-700 mb-2">{platform} Tone</label>
                        <select id={`${platform}-tone-select`} value={tones[platform]} onChange={(e) => handleToneChange(platform, e.target.value as Tone)} className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                            {Object.values(Tone).map((t) => (<option key={t} value={t}>{t}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Social Posts</h2>
              <button onClick={handleGeneratePosts} disabled={!isSourceProvided || isLoading} className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 font-bold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                <SparklesIcon className="w-5 h-5"/>
                {isLoading ? 'Generating Posts...' : 'Generate Social Posts'}
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate a Full Article</h2>
                <div className="flex items-end gap-4">
                    <div className="w-1/3">
                        <label htmlFor="word-count" className="block text-sm font-medium text-gray-700 mb-2">Words</label>
                        <input id="word-count" type="number" step="50" min="100" value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value, 10))} className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="w-2/3">
                        <button onClick={handleGenerateArticle} disabled={!isSourceProvided || isArticleLoading} className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 font-bold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                            <ArticleIcon className="w-5 h-5" />
                            {isArticleLoading ? 'Generating...' : 'Generate Article'}
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {error && (
            <div className="my-8 p-4 text-center bg-red-100 border border-red-300 text-red-800 rounded-lg">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {isLoading && <div className="my-12"><Loader /></div>}

          {isAnythingGenerated && (
            <div className="space-y-12">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Generated Content</h2>
                        <button onClick={handleSaveProject} disabled={!isAnythingGenerated} title="Save this project" className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 transition-all">
                        <SaveIcon className="w-5 h-5" /> Save Project
                        </button>
                    </div>

                    {editablePosts && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Object.keys(editablePosts).map((platform) => {
                                const p = platform as Platform;
                                if (!editablePosts[p]) return null;
                                return <PostCard key={p} platform={p} post={generatedPosts![p]!} editableContent={editablePosts[p]!} onContentChange={handleContentChange} icon={platformIcons[p]} />
                            })}
                        </div>
                    )}

                    {(generatedArticle || isArticleLoading || articleError) && (
                        <div className={editablePosts ? 'mt-12' : ''}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Generated Article</h2>
                        <ArticleDisplay article={generatedArticle} isLoading={isArticleLoading} error={articleError} />
                        </div>
                    )}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;