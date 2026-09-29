import { describe, expect, it } from 'vitest';

import { renderMarkdown } from '../../shared/markdown';

describe('project Markdown renderer', () => {
  it('renders required GFM features and strips unsafe HTML and URLs', () => {
    const html = renderMarkdown(`
# Signal Daily

- [x] shipped

| Name | Status |
| --- | --- |
| API | active |

[safe](https://example.com) [unsafe](javascript:alert(1))

![preview](https://example.com/preview.gif)

~~~ts
const status = 'active';
~~~

<script>alert('xss')</script>
`);

    expect(html).toContain('<h1>Signal Daily</h1>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<table>');
    expect(html).toContain('<pre>');
    expect(html).toContain('language-ts');
    expect(html).toContain('src="https://example.com/preview.gif"');
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:');
  });
});
