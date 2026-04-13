import type { Employee, UserJson } from '../types';
import { gravatarUrl } from '../utils/gravatar';
import { loadSlackEmployees } from './slack';
import type { AppSettings } from '../store/settings';

const SAMPLE_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Principal Engineer',
  'Product Manager', 'Designer', 'UX Researcher', 'Data Scientist',
  'Engineering Manager', 'VP of Engineering', 'CEO', 'CTO',
  'Marketing Manager', 'Sales Engineer', 'Customer Success', 'DevOps Engineer',
  'Frontend Engineer', 'Backend Engineer', 'QA Engineer', 'Security Engineer',
  'Technical Writer',
];

interface RandomUserResult {
  name: { first: string; last: string };
  email: string;
  picture: { large: string };
}

async function loadFromRandomUser(count: number): Promise<Employee[]> {
  const res = await fetch(
    `https://randomuser.me/api/?results=${count}&inc=name,email,picture&nat=us,gb,au,ca,nz`
  );
  if (!res.ok) throw new Error('Failed to fetch demo users from randomuser.me');
  const data: { results: RandomUserResult[] } = await res.json();
  return data.results.map((u, i) => ({
    id: i + 1,
    email: u.email,
    firstName: u.name.first,
    lastName: u.name.last,
    role: SAMPLE_ROLES[i % SAMPLE_ROLES.length],
    gravatar: u.picture.large,
  }));
}

function parseCustomJson(data: UserJson, showShame: boolean): Employee[] {
  const defaultImage = showShame ? 'blank' : '404';
  return data.users.map((u) => ({
    ...u,
    role: u.role ?? `${u.firstName} ${u.lastName}`,
    gravatar: gravatarUrl(u.email, defaultImage),
  }));
}

export async function loadEmployees(settings: AppSettings): Promise<Employee[]> {
  const showShame = new URLSearchParams(window.location.search).get('shame') !== null;

  switch (settings.dataSource) {
    case 'url': {
      if (!settings.customUrl) throw new Error('No custom URL configured.');
      const res = await fetch(settings.customUrl);
      if (!res.ok) throw new Error(`Failed to load from ${settings.customUrl}: HTTP ${res.status}`);
      const data: UserJson = await res.json();
      return parseCustomJson(data, showShame);
    }

    case 'slack':
      return loadSlackEmployees();

    case 'demo':
    default:
      return loadFromRandomUser(settings.demoUserCount);
  }
}
