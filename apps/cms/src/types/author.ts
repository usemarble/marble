export interface Author {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
  bio: string | null;
  email: string | null;
  slug: string;
  userId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
