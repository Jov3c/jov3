import { CvError } from './cv-service';
import type { CvService } from './cv-service';
import type { BlogService } from './blog-service';
import type { HomeService } from './home-service';
import type { ProjectService } from './project-service';
import { buildRssFeed } from '../utils/rss';
import { buildSitemapXml, type SitemapUrl } from '../utils/sitemap';

export class SitePublicationService {
  constructor(
    private readonly homeService: HomeService,
    private readonly blogService: BlogService,
    private readonly projectService: ProjectService,
    private readonly cvService: CvService,
  ) {}

  async rss(siteUrl: string) {
    const home = await this.homeService.getPublicHome();
    const posts = await this.blogService.listPublicFeed();
    return buildRssFeed(
      {
        title: home.siteProfile.siteTitle,
        description: home.siteProfile.siteDescription,
        url: siteUrl,
      },
      posts,
    );
  }

  async sitemap(siteUrl: string) {
    const archive = await this.blogService.listArchive();
    const projects = await this.projectService.listPublic();
    const cvIsPublic = await this.isCvPublic();
    const staticPaths = [
      '/',
      '/projects',
      '/blog',
      '/blog/archive',
      '/blog/links',
      '/blog/message',
      '/blog/footprint',
      '/about/timeline',
      ...(cvIsPublic ? ['/about/cv'] : []),
    ];
    const urls: SitemapUrl[] = staticPaths.map((path) => ({ loc: `${siteUrl}${path}` }));
    urls.push(...projects.items.map((project) => ({ loc: `${siteUrl}/projects/${project.slug}` })));
    for (const year of archive.years) {
      for (const month of year.months) {
        urls.push(
          ...month.items.map((post) => ({
            loc: `${siteUrl}/blog/${post.slug}`,
            lastmod: post.publishedAt.slice(0, 10),
          })),
        );
      }
    }
    return buildSitemapXml(urls);
  }

  private async isCvPublic() {
    try {
      await this.cvService.getPublic();
      return true;
    } catch (error) {
      if (error instanceof CvError && error.statusCode === 404) return false;
      throw error;
    }
  }
}
