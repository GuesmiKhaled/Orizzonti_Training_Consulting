export interface NavItem {
  readonly label: string;
  readonly icon?: string;
  readonly route?: string;
  readonly permission?: string;
  readonly children?: readonly NavItem[];
}

export const ADMIN_NAV: readonly NavItem[] = [
  {
    label: 'Overview',
    icon: 'overview',
    route: '/admin/overview',
    permission: 'view_dashboard',
  },
  {
    label: 'Users',
    icon: 'users',
    children: [
      { label: 'Users list', route: '/admin/users', permission: 'manage_users' },
      {
        label: 'Mass import',
        route: '/admin/users/import',
        permission: 'manage_users',
      },
      {
        label: 'Affiliation roles',
        route: '/admin/users/roles',
        permission: 'manage_roles',
      },
    ],
  },
  {
    label: 'Courses',
    icon: 'courses',
    children: [
      {
        label: 'Courses dashboard',
        route: '/admin/courses',
        permission: 'manage_courses',
      },
    ],
  },
  {
    label: 'Languages',
    icon: 'languages',
    children: [
      {
        label: 'Languages dashboard',
        route: '/admin/languages',
        permission: 'manage_languages',
      },
      {
        label: 'Levels',
        route: '/admin/languages/levels',
        permission: 'manage_languages',
      },
      {
        label: 'Exams',
        route: '/admin/languages/exams',
        permission: 'manage_languages',
      },
      {
        label: 'Exam registrations',
        route: '/admin/languages/registrations',
        permission: 'manage_course_requests',
      },
    ],
  },
  {
    label: 'Blogs',
    icon: 'blogs',
    route: '/admin/blogs',
    permission: 'manage_blog',
  },
  {
    label: 'Slider media',
    icon: 'media',
    route: '/admin/media',
    permission: 'manage_media',
  },
  {
    label: 'Course requests',
    icon: 'requests',
    route: '/admin/requests',
    permission: 'manage_course_requests',
  },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      {
        label: 'Site settings',
        route: '/admin/settings/site',
        permission: 'manage_site_settings',
      },
      {
        label: 'Mail settings',
        route: '/admin/settings/mail',
        permission: 'manage_mail_settings',
      },
    ],
  },
];

/** Drops items the user cannot use, and groups left without visible children. */
export function filterNav(
  items: readonly NavItem[],
  has: (permission: string) => boolean,
): NavItem[] {
  return items.flatMap((item) => {
    if (item.children) {
      const children = filterNav(item.children, has);
      return children.length ? [{ ...item, children }] : [];
    }
    return !item.permission || has(item.permission) ? [item] : [];
  });
}
