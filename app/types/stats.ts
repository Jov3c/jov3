export interface PublicSiteStats {
  onlineVisitors: number;
  totalPageViews: number;
  foundedAt: string;
  uptime: { days: number; hours: number; minutes: number; label: string };
}

export interface PublicSiteStatsResponse {
  data: PublicSiteStats;
}
