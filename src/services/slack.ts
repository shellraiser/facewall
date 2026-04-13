import type { Employee } from '../types';

interface SlackProfile {
  display_name: string;
  real_name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  image_192?: string;
  image_512?: string;
  is_custom_image?: boolean;
}

interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile: SlackProfile;
  is_bot: boolean;
  deleted: boolean;
}

interface SlackUsersResponse {
  ok: boolean;
  members: SlackUser[];
  response_metadata?: { next_cursor?: string };
  error?: string;
}

export async function loadSlackEmployees(): Promise<Employee[]> {
  const all: SlackUser[] = [];
  let cursor = '';

  // Paginate through all members
  do {
    const params = new URLSearchParams({ limit: '200' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`/api/slack/users.list?${params}`);
    if (!res.ok) throw new Error(`Slack proxy error: HTTP ${res.status}`);

    const data: SlackUsersResponse = await res.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error ?? 'unknown'}`);

    all.push(...data.members);
    cursor = data.response_metadata?.next_cursor ?? '';
  } while (cursor);

  return all
    .filter((u) => !u.deleted && !u.is_bot && u.id !== 'USLACKBOT')
    // Only include users who have set a custom profile photo
    .filter((u) => u.profile.is_custom_image && u.profile.image_192)
    .map((u): Employee => {
      // Prefer explicit first/last, fall back to splitting real_name
      const parts = (u.profile.real_name || u.real_name || u.name).split(' ');
      const firstName = u.profile.first_name || parts[0] || u.name;
      const lastName = u.profile.last_name || parts.slice(1).join(' ') || '';

      return {
        email: u.profile.email ?? `${u.id}@slack`,
        firstName,
        lastName,
        role: u.profile.title || undefined,
        // Prefer the larger image for the featured card
        gravatar: u.profile.image_512 || u.profile.image_192,
      };
    });
}
