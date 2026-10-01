export interface PublicHomeProfile {
  nickname: string;
  role: string;
  intro: string;
  avatar: { url: string; altText: string | null } | null;
  statusText: string | null;
  statusVisible: boolean;
}

export interface PublicHomeEntry {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  url: string;
  targetType: 'INTERNAL' | 'EXTERNAL';
  openNewTab: boolean;
}

export interface PublicHomeSocialLink {
  id: string;
  name: string;
  icon: string | null;
  url: string;
}

export interface PublicHomeData {
  siteProfile: {
    siteTitle: string;
    siteDescription: string;
    foundedAt: string;
    publicContactEmail: string | null;
  };
  homeProfile: PublicHomeProfile;
  entries: PublicHomeEntry[];
  socialLinks: PublicHomeSocialLink[];
}

export interface PublicHomeResponse {
  data: PublicHomeData;
}
