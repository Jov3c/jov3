export interface RssSite {
  title: string;
  description: string;
  url: string;
}

export interface RssPost {
  status: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  categoryName: string;
  publishedAt: string | null;
}

export function buildRssFeed(site: RssSite, posts: RssPost[]) {
  const items = posts
    .filter((post) => post.status === 'PUBLISHED' && post.publishedAt)
    .map((post) => {
      const url = `${site.url}/blog/${encodeURIComponent(post.slug)}`;
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <content:encoded><![CDATA[${escapeCdata(post.contentHtml)}]]></content:encoded>`,
        `      <category>${escapeXml(post.categoryName)}</category>`,
        `      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(site.url)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    '    <language>zh-CN</language>',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}

function escapeXml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character] ??
      character,
  );
}

function escapeCdata(value: string) {
  return value.replaceAll(']]>', ']]]]><![CDATA[>');
}
