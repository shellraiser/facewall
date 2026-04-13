import md5 from 'md5';

export function gravatarUrl(email: string, defaultImage: '404' | 'blank' = '404'): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://secure.gravatar.com/avatar/${hash}?d=${defaultImage}`;
}

export function gravatarUrlSized(baseUrl: string, size: number, cacheBust?: number): string {
  // Non-Gravatar URLs (e.g. randomuser.me) are returned as-is
  if (!baseUrl.includes('gravatar.com')) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('s', String(size));
  if (cacheBust !== undefined) {
    url.searchParams.set('_', String(cacheBust));
  }
  return url.toString();
}
