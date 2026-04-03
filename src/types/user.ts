export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = "Standard Member" | "Premium Member";
