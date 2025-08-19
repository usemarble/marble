export type MediaType = "image" | "video" | "audio" | "document";

export type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};
