export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys: number;
}

export class SlidingWindowRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly options: RateLimiterOptions) {
    if (options.limit < 1 || options.windowMs < 1 || options.maxKeys < 1) {
      throw new Error('Rate limiter options must be positive integers');
    }
  }

  consume(key: string, now = Date.now()): RateLimitResult {
    this.pruneExpired(now);
    const threshold = now - this.options.windowMs;
    const timestamps = (this.attempts.get(key) ?? []).filter((value) => value > threshold);

    if (timestamps.length >= this.options.limit) {
      this.attempts.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(1, timestamps[0]! + this.options.windowMs - now),
      };
    }

    if (!this.attempts.has(key) && this.attempts.size >= this.options.maxKeys) {
      const oldestKey = this.attempts.keys().next().value as string | undefined;
      if (oldestKey) this.attempts.delete(oldestKey);
    }

    timestamps.push(now);
    this.attempts.delete(key);
    this.attempts.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.options.limit - timestamps.length,
      retryAfterMs: 0,
    };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }

  private pruneExpired(now: number) {
    const threshold = now - this.options.windowMs;
    for (const [key, timestamps] of this.attempts) {
      const active = timestamps.filter((value) => value > threshold);
      if (active.length === 0) this.attempts.delete(key);
      else this.attempts.set(key, active);
    }
  }
}
