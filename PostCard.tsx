import React, { useState, useEffect, useRef } from 'react';
import { Platform, Post } from '../types';
import CopyIcon from './icons/CopyIcon';
import ScheduleIcon from './icons/ScheduleIcon';
import ShareIcon from './icons/ShareIcon';
import CalendarIcon from './icons/CalendarIcon';
import RegenerateIcon from './icons/RegenerateIcon';
import UploadIcon from './icons/UploadIcon';
import TranslateIcon from './icons/TranslateIcon';
import { generateImage, translateText } from '../services/geminiService';

interface PostCardProps {
  platform: Platform;
  post: Post;
  icon: React.ReactNode;
  editableContent: Post;
  onContentChange: (platform: Platform, newContent: Post) => void;
}

const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Mandarin' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
];

const PostCard: React.FC<PostCardProps> = ({ platform, icon, editableContent, onContentChange }) => {
  const [copied, setCopied] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduledConfirmation, setScheduledConfirmation] = useState<string | null>(null);
  const [scheduledPost, setScheduledPost] = useState<{ post: Post; time: string } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<Post | null>(null);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const translateDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (scheduledConfirmation) {
      const timer = setTimeout(() => setScheduledConfirmation(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [scheduledConfirmation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (translateDropdownRef.current && !translateDropdownRef.current.contains(event.target as Node)) {
            setShowTranslateDropdown(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopy = () => {
    const contentToDisplay = translatedContent || editableContent;
    const textToCopy = (platform === Platform.Reddit || platform === Platform.YouTube)
      ? `Title: ${contentToDisplay.title || ''}\n\n${contentToDisplay.content}`
      : contentToDisplay.content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranslatedContent(null);
    onContentChange(platform, { ...editableContent, title: e.target.value });
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranslatedContent(null);
    onContentChange(platform, { ...editableContent, content: e.target.value });
  };

  const handleScheduleClick = () => {
    setIsScheduling(!isScheduling);
    if (!isScheduling) {
        setScheduledConfirmation(null);
    }
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDateTime) return;
    
    const postToSchedule = {
      post: editableContent,
      time: scheduleDateTime,
    };
    setScheduledPost(postToSchedule);

    const formattedDate = new Date(scheduleDateTime).toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
    });
    setScheduledConfirmation(`Post scheduled for ${formattedDate}`);
    setIsScheduling(false);
    setScheduleDateTime('');
  };

  const handlePostNow = () => {
    const content = editableContent.content;
    const title = editableContent.title || '';

    switch (platform) {
        case Platform.Twitter:
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`, '_blank', 'noopener,noreferrer');
            break;
        case Platform.LinkedIn:
        case Platform.Instagram:
            navigator.clipboard.writeText(content);
            setCopied(true); 
            const postUrl = platform === Platform.LinkedIn ? 'https://www.linkedin.com/feed/' : 'https://www.instagram.com/';
            window.open(postUrl, '_blank', 'noopener,noreferrer');
            break;
        case Platform.Reddit:
        case Platform.YouTube:
            const textToPost = `Title: ${title}\n\n${content}`;
            navigator.clipboard.writeText(textToPost);
            setCopied(true);
            const submitUrl = platform === Platform.Reddit ? 'https://www.reddit.com/submit' : 'https://www.youtube.com/upload';
            window.open(submitUrl, '_blank', 'noopener,noreferrer');
            break;
    }
  };

  const generateGoogleCalendarLink = () => {
    if (!scheduledPost) return '#';

    const startTime = new Date(scheduledPost.time);
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 minute event

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');

    const title = encodeURIComponent(`Publish Post to ${platform}`);
    const detailsText = (platform === Platform.Reddit || platform === Platform.YouTube)
        ? `Title: ${scheduledPost.post.title || ''}\n\n${scheduledPost.post.content}`
        : scheduledPost.post.content;
    const details = encodeURIComponent(`Time to publish the scheduled post on ${platform}.\n\nContent:\n${detailsText}`);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${details}`;
  };

  const handleRegenerateImage = async () => {
    setIsImageLoading(true);
    try {
      const prompt =
        (platform === Platform.Reddit || platform === Platform.YouTube)
          ? `${editableContent.title || ''}: ${editableContent.content}`
          : editableContent.content;
      const newImageUrl = await generateImage(prompt.substring(0, 250));
      if (newImageUrl) {
        onContentChange(platform, { ...editableContent, imageUrl: newImageUrl });
      } else {
        console.error("Failed to regenerate image.");
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onContentChange(platform, { ...editableContent, imageUrl: base64String });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranslate = async (language: string) => {
    setShowTranslateDropdown(false);
    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedContent(null);
    try {
        const { translatedTitle, translatedContent } = await translateText(editableContent.content, editableContent.title, language);
        setTranslatedContent({
            title: translatedTitle || editableContent.title,
            content: translatedContent,
            imageUrl: editableContent.imageUrl
        });
    } catch (err: any) {
        setTranslationError(err.message);
    } finally {
        setIsTranslating(false);
    }
  };
  
  const contentToDisplay = translatedContent || editableContent;
  const hasTitle = platform === Platform.Reddit || platform === Platform.YouTube;

  return (
    <div className="bg-white rounded-xl shadow-md flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 hover:border-blue-500 hover:shadow-lg">
      <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-blue-600">{icon}</span>
          <h3 className="text-lg font-bold text-gray-800">{platform}</h3>
        </div>
        <div className="flex items-center gap-2">
            <div ref={translateDropdownRef} className="relative">
                <button
                    onClick={() => setShowTranslateDropdown(prev => !prev)}
                    title="Translate Content"
                    className="p-2 rounded-md flex items-center gap-2 transition-colors duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                    <TranslateIcon className="w-4 h-4" />
                </button>
                {showTranslateDropdown && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1">
                        {languages.map(lang => (
                            <button key={lang.code} onClick={() => handleTranslate(lang.name)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{lang.name}</button>
                        ))}
                    </div>
                )}
            </div>
            <button
                onClick={handlePostNow}
                title="Post Now"
                className="px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors duration-200 bg-indigo-600 text-white hover:bg-indigo-700"
            >
                <ShareIcon className="w-4 h-4" />
                Post
            </button>
            <button
                onClick={handleScheduleClick}
                title={isScheduling ? 'Cancel Scheduling' : 'Schedule Post'}
                className={`p-2 rounded-md flex items-center gap-2 transition-colors duration-200 ${
                    isScheduling ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
                <ScheduleIcon className="w-4 h-4" />
            </button>
            <button
            onClick={handleCopy}
            title="Copy Content"
            className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors duration-200 ${
                copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            >
            <CopyIcon className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>

      <div className="relative w-full h-48 bg-gray-200 group">
        {isImageLoading ? (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-gray-600">Generating...</span>
            </div>
        ) : editableContent.imageUrl ? (
            <img src={editableContent.imageUrl} alt={`${platform} post image`} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center border-b border-gray-200">
                <span className="text-gray-400 text-sm">No image generated</span>
            </div>
        )}

        {!isImageLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                <button
                    onClick={handleRegenerateImage}
                    title="Regenerate Image"
                    className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-all"
                >
                    <RegenerateIcon className="w-4 h-4" />
                    Regenerate
                </button>
                <label
                    htmlFor={`upload-${platform}`}
                    title="Upload Image"
                    className="cursor-pointer bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-all"
                >
                    <UploadIcon className="w-4 h-4" />
                    Upload
                </label>
                <input ref={fileInputRef} id={`upload-${platform}`} type="file" accept="image/*" onChange={handleImageUpload} className="sr-only"/>
            </div>
        )}
      </div>


      <div className="p-4 flex-grow flex flex-col gap-3">
        {translatedContent && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-center">
                <button onClick={() => setTranslatedContent(null)} className="text-xs font-semibold text-blue-700 hover:underline">Show Original</button>
            </div>
        )}
        {isTranslating && (
             <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-center text-sm text-gray-600">Translating...</div>
        )}
        {translationError && (
             <div className="p-2 bg-red-50 border border-red-200 rounded-md text-center text-sm text-red-700">{translationError}</div>
        )}
        {hasTitle && (
          <input
            type="text"
            value={contentToDisplay.title || ''}
            onChange={handleTitleChange}
            readOnly={!!translatedContent}
            className="w-full bg-gray-100 p-2 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold border border-gray-200"
            placeholder="Post Title"
          />
        )}
        <textarea
          value={contentToDisplay.content}
          onChange={handleContentChange}
          readOnly={!!translatedContent}
          className="w-full flex-grow bg-gray-50 p-3 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[250px] border border-gray-200"
          placeholder="Generated content will appear here..."
        />
      </div>

      {(isScheduling || scheduledConfirmation) && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 transition-all">
          {isScheduling && (
              <div>
                <label htmlFor={`schedule-${platform}`} className="block text-sm font-medium text-gray-700 mb-2">Schedule Date & Time</label>
                <div className="flex items-center gap-2">
                    <input
                        type="datetime-local"
                        id={`schedule-${platform}`}
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full bg-white p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleConfirmSchedule}
                        disabled={!scheduleDateTime}
                        className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        Set
                    </button>
                </div>
              </div>
          )}
          {scheduledConfirmation && !isScheduling && (
              <div className="text-center space-y-3">
                  <p className="text-sm font-semibold text-green-700">{scheduledConfirmation}</p>
                  <a
                    href={generateGoogleCalendarLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-all"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Add to Google Calendar
                  </a>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
