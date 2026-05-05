import { CategoryConfig, SidebarGroup } from '@/lib/types';

// Profile category (no sort_order — single record)
const profileCategory: CategoryConfig = {
  key: 'profiles',
  label: 'Profile',
  icon: '👤',
  fields: [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Khunapoj Suttenon' },
    { name: 'headline', label: 'Headline', type: 'text', placeholder: 'e.g., Computer Engineering · Web Developer' },
    { name: 'short_bio', label: 'Short Bio', type: 'textarea', placeholder: 'Write a brief bio...' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Bangkok, Thailand' },
    { name: 'email', label: 'Email', type: 'text', placeholder: 'your@email.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+66...' },
    { name: 'website_url', label: 'Website URL', type: 'url' },
    { name: 'github_url', label: 'GitHub URL', type: 'url' },
    { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
    { name: 'profile_image_url', label: 'Profile Image', type: 'image' },
    { name: 'resume_url', label: 'Resume PDF', type: 'file', accept: 'application/pdf' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const educationCategory: CategoryConfig = {
  key: 'education',
  label: 'Education',
  icon: '🎓',
  fields: [
    { name: 'institution', label: 'Institution', type: 'text', required: true, placeholder: 'e.g., KMUTNB' },
    { name: 'degree', label: 'Degree', type: 'text', placeholder: 'e.g., Bachelor of Engineering' },
    { name: 'field', label: 'Field of Study', type: 'text', placeholder: 'e.g., Computer Engineering' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Bangkok, Thailand' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const experiencesCategory: CategoryConfig = {
  key: 'experiences',
  label: 'Experiences',
  icon: '💼',
  fields: [
    { name: 'company', label: 'Company', type: 'text', required: true, placeholder: 'e.g., Google' },
    { name: 'role', label: 'Role', type: 'text', required: true, placeholder: 'e.g., Software Engineer' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Bangkok, Thailand' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'highlights', label: 'Highlights', type: 'json-array', placeholder: 'One highlight per line' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const projectsCategory: CategoryConfig = {
  key: 'projects',
  label: 'Projects',
  icon: '🚀',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Portfolio Website' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'tech_stack', label: 'Tech Stack', type: 'json-array', placeholder: 'One technology per line' },
    { name: 'project_url', label: 'Project URL', type: 'url' },
    { name: 'github_url', label: 'GitHub URL', type: 'url' },
    { name: 'image_url', label: 'Cover Image', type: 'image' },
    { name: 'gallery_images', label: 'Gallery Images', type: 'gallery' },
    { name: 'highlights', label: 'Highlights', type: 'json-array', placeholder: 'One highlight per line' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const skillsCategory: CategoryConfig = {
  key: 'skills',
  label: 'Skills',
  icon: '⚡',
  fields: [
    { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g., Frontend, Backend, DevOps & Infrastructure' },
    { name: 'name', label: 'Skills (one per line)', type: 'textarea', placeholder: 'React & Next.js Web Apps\nSystem Architecture & Design\nUI/UX & User Experience' },
    { name: 'icon', label: 'Icon', type: 'text', placeholder: 'e.g., <> or 🌐 (emoji/symbol for card header)' },
    { name: 'level', label: 'Level', type: 'text', placeholder: 'e.g., Advanced, Intermediate' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const testScoresCategory: CategoryConfig = {
  key: 'test_scores',
  label: 'Test Scores',
  icon: '📊',
  fields: [
    { name: 'test_name', label: 'Test Name', type: 'text', required: true, placeholder: 'e.g., TOEIC' },
    { name: 'score', label: 'Score', type: 'text', placeholder: 'e.g., 850' },
    { name: 'max_score', label: 'Max Score', type: 'text', placeholder: 'e.g., 990' },
    { name: 'test_date', label: 'Test Date', type: 'date' },
    { name: 'issuer', label: 'Issuer', type: 'text', placeholder: 'e.g., ETS' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const awardsCategory: CategoryConfig = {
  key: 'awards',
  label: 'Honors & Awards',
  icon: '🏆',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Best Project Award' },
    { name: 'issuer', label: 'Issuer', type: 'text', placeholder: 'e.g., University' },
    { name: 'award_date', label: 'Award Date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'url', label: 'URL', type: 'url' },
    { name: 'gallery_images', label: 'Activity Pictures', type: 'gallery' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

const certificationsCategory: CategoryConfig = {
  key: 'certifications',
  label: 'Licenses & Certifications',
  icon: '📜',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., AWS Solutions Architect' },
    { name: 'issuer', label: 'Issuer', type: 'text', required: true, placeholder: 'e.g., Amazon Web Services' },
    { name: 'issue_date', label: 'Issue Date', type: 'date' },
    { name: 'expiration_date', label: 'Expiration Date', type: 'date' },
    { name: 'credential_id', label: 'Credential ID', type: 'text' },
    { name: 'credential_url', label: 'Credential URL', type: 'url' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'gallery_images', label: 'Activity Pictures', type: 'gallery' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'toggle' },
  ],
};

// Grouped sidebar for admin navigation (courses removed)
export const sidebarGroups: SidebarGroup[] = [
  {
    label: 'About',
    items: [
      profileCategory,
      educationCategory,
      experiencesCategory,
      projectsCategory,
      skillsCategory,
      testScoresCategory,
    ],
  },
  {
    label: 'Awards',
    items: [awardsCategory],
  },
  {
    label: 'Certifications',
    items: [certificationsCategory],
  },
];

// Flat list of all categories (for lookups)
export const categories: CategoryConfig[] = sidebarGroups.flatMap((g) => g.items);
