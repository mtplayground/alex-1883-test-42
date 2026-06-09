import type { NextFunction, Request, Response } from "express";

import type { RateLimitConfig } from "../config.js";

interface ClientBucket {
  count: number;
  resetAt: number;
}

function firstForwardedAddress(value: string | string[] | undefined): string | undefined {
  const headerValue = Array.isArray(value) ? value[0] : value;
  return headerValue
    ?.split(",")
    .map((address) => address.trim())
    .find(Boolean);
}

function clientKey(req: Request): string {
  return (
    firstForwardedAddress(req.headers["x-forwarded-for"]) ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown-client"
  );
}

function setRateLimitHeaders(
  res: Response,
  config: RateLimitConfig,
  bucket: ClientBucket,
  now: number
) {
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const remaining = Math.max(0, config.maxRequests - bucket.count);

  res.setHeader("RateLimit-Limit", String(config.maxRequests));
  res.setHeader("RateLimit-Remaining", String(remaining));
  res.setHeader("RateLimit-Reset", String(resetSeconds));
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  const buckets = new Map<string, ClientBucket>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = clientKey(req);
    const existingBucket = buckets.get(key);
    const bucket =
      existingBucket && existingBucket.resetAt > now
        ? existingBucket
        : { count: 0, resetAt: now + config.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    for (const [bucketKey, trackedBucket] of buckets) {
      if (trackedBucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }

    setRateLimitHeaders(res, config, bucket, now);

    if (bucket.count > config.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many run requests. Try again after the current window resets.",
          retryAfterSeconds
        }
      });
      return;
    }

    next();
  };
}
