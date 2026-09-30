import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Docker runtime contract', () => {
  it('ships shared server dependencies used by content seeding', async () => {
    const dockerfile = await readFile(resolve(process.cwd(), 'Dockerfile'), 'utf8');

    expect(dockerfile).toMatch(
      /COPY\s+(?:--chown=[^\s]+\s+)?--from=build\s+\/app\/shared\s+\.\/shared/,
    );
  });
});
