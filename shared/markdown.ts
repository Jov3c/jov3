import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'input',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
] as const;

const renderer = new marked.Renderer();
renderer.html = ({ raw }) => escapeHtml(raw);

export function renderMarkdown(markdown: string) {
  const parsed = marked.parse(markdown, {
    gfm: true,
    breaks: false,
    renderer,
  });

  return sanitizeHtml(String(parsed), {
    allowedTags: [...allowedTags],
    allowedAttributes: {
      a: ['href', 'title'],
      code: ['class'],
      img: ['alt', 'height', 'src', 'title', 'width'],
      input: ['checked', 'disabled', 'type'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}
