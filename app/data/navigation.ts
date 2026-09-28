export interface NavigationItem {
  label: string;
  to: string;
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Blog', to: '/blog' },
];

export const aboutNavigation: NavigationItem[] = [
  { label: 'CV', to: '/about/cv' },
  { label: 'Timeline', to: '/about/timeline' },
];

export const blogNavigation: NavigationItem[] = [
  { label: '归档', to: '/blog/archive' },
  { label: '友链', to: '/blog/links' },
  { label: '留言', to: '/blog/message' },
  { label: '足迹', to: '/blog/footprint' },
];
