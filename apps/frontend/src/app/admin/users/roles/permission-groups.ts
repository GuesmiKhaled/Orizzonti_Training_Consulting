import { AdminPermission } from '../../../services/orizzonti-api.service';

interface GroupDefinition {
  readonly title: string;
  readonly names: readonly string[];
}

const GROUPS: readonly GroupDefinition[] = [
  {
    title: 'Content',
    names: [
      'manage_blog',
      'manage_courses',
      'manage_languages',
      'manage_media',
      'manage_site_settings',
    ],
  },
  { title: 'Requests', names: ['manage_course_requests'] },
  { title: 'Access', names: ['manage_users', 'manage_roles', 'manage_permissions'] },
  {
    title: 'System',
    names: ['manage_mail_settings', 'view_dashboard', 'view_statistics'],
  },
];

const LABELS: Readonly<Record<string, string>> = {
  manage_blog: 'Blogs',
  manage_courses: 'Courses',
  manage_languages: 'Languages',
  manage_media: 'Slider media',
  manage_site_settings: 'Site settings',
  manage_course_requests: 'Course requests',
  manage_users: 'Users',
  manage_roles: 'Roles',
  manage_permissions: 'Permissions',
  manage_mail_settings: 'Mail settings',
  view_dashboard: 'Dashboard',
  view_statistics: 'Statistics',
};

export interface PermissionGroup {
  readonly title: string;
  readonly items: readonly AdminPermission[];
}

export const permissionLabel = (name: string): string => LABELS[name] ?? name;

/** Groups the API's permissions for display; unknown ones land in "Other". */
export function groupPermissions(
  permissions: readonly AdminPermission[],
): PermissionGroup[] {
  const byName = new Map(permissions.map((p) => [p.name, p]));
  const known = new Set(GROUPS.flatMap((g) => g.names));
  const groups: PermissionGroup[] = GROUPS.map((group) => ({
    title: group.title,
    items: group.names
      .map((name) => byName.get(name))
      .filter((p): p is AdminPermission => !!p),
  }));
  groups.push({
    title: 'Other',
    items: permissions.filter((p) => !known.has(p.name)),
  });
  return groups.filter((group) => group.items.length > 0);
}
