import { env } from '../../env.js';

export interface ImageVersions {
  large: string;
  medium: string;
  small: string;
  micro: string;
}

export interface UserImage {
  link: string;
  versions: ImageVersions;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
}

export interface Cursus {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CursusUser {
  id: number;
  begin_at: string;
  end_at: string;
  grade: string;
  level: number;
  skills: Skill[];
  cursus_id: number;
  has_coalition: boolean;
  blackholed_at: string;
  created_at: string;
  updated_at: string;
  user: FortyTwoUser;
  cursus: Cursus;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectsUser {
  id: number;
  occurrence: number;
  final_mark: number;
  status: string;
  validated?: boolean;
  current_team_id: number;
  project: Project;
  cursus_ids: number[];
  marked_at: string;
  marked: boolean;
  retriable_at: string;
  created_at: string;
  updated_at: string;
}

export interface LanguageUser {
  id: number;
  language_id: number;
  user_id: number;
  position: number;
  created_at: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  tier: string;
  kind: string;
  visible: boolean;
  image: string;
  nbr_of_success: number;
  users_url: string;
}

export interface Title {
  id: number;
  name: string;
}

export interface TitleUser {
  id: number;
  user_id: number;
  title_id: number;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpertiseUser {
  id: number;
  expertise_id: number;
  interested: boolean;
  value: number;
  contact_me: boolean;
  created_at: string;
  user_id: number;
}

export interface Language {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: number;
  name: string;
  time_zone: string;
  language: Language;
  users_count: number;
  vogsphere_id: number;
  country: string;
  address: string;
  zip: string;
  city: string;
  website: string;
  facebook: string;
  twitter: string;
  active: boolean;
  public: boolean;
  email_extension: string;
  default_hidden_phone: boolean;
}

export interface CampusUser {
  id: number;
  user_id: number;
  campus_id: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface FortyTwoUser {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  usual_first_name: string;
  url: string;
  phone: string;
  displayname: string;
  kind: string;
  image: UserImage;
  staff?: boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location: string;
  wallet: number;
  anonymize_date: string;
  data_erasure_date: string;
  created_at: string;
  updated_at: string;
  alumnized_at: string;
  alumni?: boolean;
  active?: boolean;
  groups: unknown[];
  cursus_users: CursusUser[];
  projects_users: ProjectsUser[];
  languages_users: LanguageUser[];
  achievements: Achievement[];
  titles: Title[];
  titles_users: TitleUser[];
  partnerships: unknown[];
  patroned: unknown[];
  patroning: unknown[];
  expertises_users: ExpertiseUser[];
  roles: unknown[];
  campus: Campus[];
  campus_users: CampusUser[];
}

// Fetch user info from 42 API
async function fetch42User(token: string) {
  const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error(
      `Failed to fetch user info from 42 API: ${userResponse.statusText}`
    );
  }
  const userData = (await userResponse.json()) as FortyTwoUser;
  if (!userData || !userData.id) {
    throw new Error('Invalid user data received from 42 API');
  }

  // find userData.projects_users with project.slug === "ft_transcendence"
  const project = userData.projects_users.find(
    (pu) => pu.project.slug === 'ft_transcendence'
  );
  if (project && project.status !== 'finished') {
    console.info(
      userData.first_name +
        ' ' +
        userData.last_name +
        ' has not finished the ft_transcendence project'
    );
  }

  const user = {
    uuid: userData.id,
    nickname: userData.first_name + ' ' + userData.last_name,
    email: userData.email,
    avatar: userData.image.link,
  };

  return user;
}

import type { OAuthProviderOptions } from '../../index.js';

const FortyTwo: OAuthProviderOptions = {
  name: '42',
  client: {
    id: env.FORTYTWO_CLIENT_ID || '',
    secret: env.FORTYTWO_CLIENT_SECRET || '',
  },
  auth: {
    tokenHost: 'https://api.intra.42.fr',
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize',
  },
  scopes: ['public'],
  fetchUserData: fetch42User,
};

export { FortyTwo };
