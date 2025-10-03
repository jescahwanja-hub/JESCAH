import { GoogleGenAI, Type } from "@google/genai";
import { Tone, GeneratedPosts, Platform } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type MediaInput = {
    mimeType: string;
    data: string; // base64 encoded
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        [Platform.LinkedIn]: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The full text content for the LinkedIn post." }
            },
            required: ["content"]
        },
        [Platform.Twitter]: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The full text content for the Twitter post (tweet)." }
            },
            required: ["content"]
        },
        [Platform.Reddit]: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title for the Reddit post." },
                content: { type: Type.STRING, description: "The body content for the Reddit post." }
            },
            required: ["title", "content"]
        },
        [Platform.Instagram]: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The full text content for the Instagram caption." }
            },
            required: ["content"]
        },
        [Platform.YouTube]: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title for the YouTube video." },
                content: { type: Type.STRING, description: "The body content for the YouTube video description." }
            },
            required: ["title", "content"]
        },
        [Platform.ScriptIdeas]: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "A bulleted list of 3-5 distinct script ideas or content angles based on the source material." }
            },
            required: ["content"]
        }
    },
    required: [Platform.LinkedIn, Platform.Twitter, Platform.Reddit, Platform.Instagram, Platform.YouTube, Platform.ScriptIdeas]
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const imagePrompt = `A visually appealing and relevant image for a social media post about: "${prompt}". Minimalist, clean, professional style.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return '';
    } catch (error) {
        console.error("Error generating image:", error);
        return ''; // Return empty string on failure to not break the flow
    }
};


export const generateSocialPosts = async (source: string | MediaInput, tones: Record<string, Tone>): Promise<GeneratedPosts> => {
    const instructionPrompt = `
        Based on the provided content, generate social media posts for LinkedIn, Twitter, Reddit, Instagram, YouTube, and a list of script ideas.

        Follow these specific instructions for each:

        1.  **LinkedIn:**
            *   **Tone:** ${tones.LinkedIn}.
            *   **Content:** A brief summary, 1-2 key takeaways or insights, and a call to action to read the full article or watch the video.
            *   **Formatting:** Include 3-4 relevant professional hashtags at the end.

        2.  **Twitter:**
            *   **Tone:** ${tones.Twitter}.
            *   **Content:** A headline-style summary or a single striking statistic.
            *   **Formatting:** Must be under 280 characters. Include 2-3 relevant and trending hashtags. Do NOT include the original link.

        3.  **Reddit:**
            *   **Tone:** ${tones.Reddit}.
            *   **Content:** A neutral summary of the source, followed by an open-ended question to spark conversation.
            *   **Formatting:** No hashtags. Provide a clear and concise title for the post.
        
        4.  **Instagram:**
            *   **Tone:** ${tones.Instagram}.
            *   **Content:** An engaging caption for an image post. Start with a hook. Use emojis liberally.
            *   **Formatting:** Include 5-10 relevant and popular hashtags at the end, on new lines.

        5.  **YouTube:**
            *   **Tone:** ${tones.YouTube}.
            *   **Content:** A detailed video description. Start with a concise summary of the video content. Add relevant links (placeholder links are fine).
            *   **Formatting:** Provide a catchy, SEO-friendly title for the video. The description should include relevant keywords. Add 3-4 relevant hashtags at the end.
        
        6.  **Script Ideas:**
            *   **Tone:** ${tones.ScriptIdeas}.
            *   **Content:** Generate a bulleted list of 3-5 distinct and creative script ideas or content angles based on the source. These should be brief concepts that could be fleshed out into a full video script.
            *   **Formatting:** Use bullet points (e.g., '* Idea 1...').

        Return the result as a JSON object.
    `;

    let contents: any;

    if (typeof source === 'string') {
        const fullPrompt = source.startsWith('http')
            ? `Analyze the content from the following URL: ${source}\n\n${instructionPrompt}`
            : `Analyze the following text content:\n\n${source}\n\n${instructionPrompt}`;
        contents = fullPrompt;
    } else {
        const videoPart = {
            inlineData: {
                mimeType: source.mimeType,
                data: source.data,
            },
        };
        const textPart = { text: `Analyze the content of this video.\n\n${instructionPrompt}` };
        contents = { parts: [videoPart, textPart] };
    }

    try {
        // Step 1: Generate Text Content
        const textGenResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });

        const jsonText = textGenResponse.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        // FIX: Use bracket notation for property access to support keys with spaces like "Script Ideas".
        if (!parsedJson[Platform.LinkedIn] || !parsedJson[Platform.Twitter] || !parsedJson[Platform.Reddit] || !parsedJson[Platform.Instagram] || !parsedJson[Platform.YouTube] || !parsedJson[Platform.ScriptIdeas]) {
            throw new Error("Generated JSON is missing required platform data.");
        }

        const textPosts: GeneratedPosts = parsedJson;
        
        // Step 2: Generate Images for each post concurrently
        // FIX: Use bracket notation for property access for consistency and to support keys with spaces.
        const imagePrompts = [
            { platform: Platform.LinkedIn, prompt: textPosts[Platform.LinkedIn].content },
            { platform: Platform.Twitter, prompt: textPosts[Platform.Twitter].content },
            { platform: Platform.Reddit, prompt: `${textPosts[Platform.Reddit].title}: ${textPosts[Platform.Reddit].content}` },
            { platform: Platform.Instagram, prompt: textPosts[Platform.Instagram]!.content },
            { platform: Platform.YouTube, prompt: textPosts[Platform.YouTube]!.title! },
            { platform: Platform.ScriptIdeas, prompt: "A minimalist and professional image representing creative brainstorming, scriptwriting, or new ideas. Abstract, clean design." },
        ];
        
        const imagePromises = imagePrompts.map(p => generateImage(p.prompt.substring(0, 250)));
        const imageUrls = await Promise.all(imagePromises);

        // Step 3: Combine text and images
        // FIX: Use bracket notation for property access to fix error with "Script Ideas" key.
        const finalPosts: GeneratedPosts = {
            [Platform.LinkedIn]: { ...textPosts[Platform.LinkedIn], imageUrl: imageUrls[0] },
            [Platform.Twitter]: { ...textPosts[Platform.Twitter], imageUrl: imageUrls[1] },
            [Platform.Reddit]: { ...textPosts[Platform.Reddit], imageUrl: imageUrls[2] },
            [Platform.Instagram]: { ...textPosts[Platform.Instagram]!, imageUrl: imageUrls[3] },
            [Platform.YouTube]: { ...textPosts[Platform.YouTube]!, imageUrl: imageUrls[4] },
            [Platform.ScriptIdeas]: { ...textPosts[Platform.ScriptIdeas]!, imageUrl: imageUrls[5] },
        };
        
        return finalPosts;

    } catch (e) {
        console.error("Error generating or parsing Gemini response:", e);
        throw new Error("Failed to generate content. The AI may be unable to access the source or returned an unexpected format. Please try a different source.");
    }
};

export const generateArticle = async (source: string | MediaInput, wordCount: number): Promise<string> => {
    const instructionPrompt = `
        Based on the provided content, write a comprehensive and well-structured article of approximately ${wordCount} words.
        The article should have a clear title, an engaging introduction, several body paragraphs that explore the topic in depth, and a concluding summary.
        Format the output as plain text. Do not use Markdown. The first line must be the article title.
    `;

    let contents: any;

    if (typeof source === 'string') {
        const fullPrompt = source.startsWith('http')
            ? `Analyze the content from the following URL: ${source}\n\n${instructionPrompt}`
            : `Analyze the following text content:\n\n${source}\n\n${instructionPrompt}`;
        contents = fullPrompt;
    } else {
        const videoPart = {
            inlineData: {
                mimeType: source.mimeType,
                data: source.data,
            },
        };
        const textPart = { text: `Analyze the content of this video.\n\n${instructionPrompt}` };
        contents = { parts: [videoPart, textPart] };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                temperature: 0.6,
            },
        });

        return response.text.trim();
    } catch (e) {
        console.error("Error generating article:", e);
        throw new Error("Failed to generate the article. Please try a different source or adjust the word count.");
    }
};

export const translateText = async (text: string, title: string | undefined, targetLanguage: string): Promise<{ translatedTitle?: string, translatedContent: string }> => {
    try {
        if (title) {
            const prompt = `Translate the following title and content into ${targetLanguage}. Return a JSON object with two keys: "translatedTitle" and "translatedContent".\n\nTitle: "${title}"\n\nContent: "${text}"`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translatedTitle: { type: Type.STRING },
                            translatedContent: { type: Type.STRING }
                        },
                        required: ["translatedTitle", "translatedContent"]
                    }
                }
            });
            return JSON.parse(response.text);
        } else {
            const prompt = `Translate the following text into ${targetLanguage}: "${text}"`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            return { translatedContent: response.text };
        }
    } catch (e) {
        console.error("Error translating text:", e);
        throw new Error(`Failed to translate text to ${targetLanguage}.`);
    }
};