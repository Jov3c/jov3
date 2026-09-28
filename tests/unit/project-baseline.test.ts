import { describe, expect, it } from 'vitest';

import { PROJECT_NAME } from '../../shared/constants/project';

describe('project baseline', () => {
  it('exposes the public project identity', () => {
    expect(PROJECT_NAME).toBe('JOV3');
  });

  it('runs tests on the supported Node major version', () => {
    expect(process.version.startsWith('v24.')).toBe(true);
  });
});
