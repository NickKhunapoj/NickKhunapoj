// TypeScript interfaces for all Supabase tables

export interface Profile {
  id: string;
  full_name: string;
  headline: string | null;
  hero_intro: string | null;
  short_bio: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  profile_image_url: string | null;
  resume_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  highlights: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  expiration_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  gallery_images: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  project_url: string | null;
  github_url: string | null;
  image_url: string | null;
  gallery_images: string[];
  highlights: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  level: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string | null;
  award_date: string | null;
  description: string | null;
  url: string | null;
  gallery_images: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestScore {
  id: string;
  test_name: string;
  score: string | null;
  max_score: string | null;
  test_date: string | null;
  issuer: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Table name to type mapping (courses removed — table left in DB but unused)
export type TableName =
  | 'profiles'
  | 'education'
  | 'experiences'
  | 'certifications'
  | 'projects'
  | 'skills'
  | 'awards'
  | 'test_scores';

// Category configuration for admin
export interface CategoryConfig {
  key: TableName;
  label: string;
  icon: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'url' | 'toggle' | 'json-array' | 'image' | 'file' | 'gallery';
  required?: boolean;
  placeholder?: string;
  accept?: string;
}

// Sidebar group for admin navigation
export interface SidebarGroup {
  label: string;
  items: CategoryConfig[];
}
