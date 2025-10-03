export enum Platform {
  LinkedIn = 'LinkedIn',
  Twitter = 'Twitter',
  Reddit = 'Reddit',
  Instagram = 'Instagram',
  YouTube = 'YouTube',
  ScriptIdeas = 'Script Ideas',
}

export enum Tone {
  Professional = 'Professional',
  Casual = 'Casual',
  Analytical = 'Analytical',
  Witty = 'Witty',
  Humorous = 'Humorous',
  Inspirational = 'Inspirational',
  Authoritative = 'Authoritative',
  Creative = 'Creative',
}

export interface Post {
  title?: string;
  content: string;
  imageUrl?: string;
}

export type GeneratedPosts = {
  [Platform.LinkedIn]: Post;
  [Platform.Twitter]: Post;
  [Platform.Reddit]: Post;
  [Platform.Instagram]?: Post;
  [Platform.YouTube]?: Post;
  [Platform.ScriptIdeas]?: Post;
};

export interface SavedProject {
  id: number;
  name: string;
  posts?: GeneratedPosts;
  article?: string;
}