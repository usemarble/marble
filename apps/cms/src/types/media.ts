export type MediaType = "image" | "video" | "audio" | "document";

export type UploadType = "avatar" | "author-avatar" | "logo" | "media";

export type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};
