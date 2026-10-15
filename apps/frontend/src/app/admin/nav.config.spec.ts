import { ADMIN_NAV, NavItem, filterNav } from './nav.config';

const labels = (items: readonly NavItem[]): string[] =>
  items.flatMap((item) => [item.label, ...labels(item.children ?? [])]);

describe('filterNav', () => {
  it('shows everything to a user with every permission', () => {
    const all = filterNav(ADMIN_NAV, () => true);
    expect(labels(all)).toContain('Exam registrations');
    expect(labels(all)).toContain('Mail settings');
  });

  it('shows nothing when the user has no permission', () => {
    expect(filterNav(ADMIN_NAV, () => false)).toEqual([]);
  });

  it('keeps only permitted leaves and drops empty groups', () => {
    const result = filterNav(ADMIN_NAV, (p) => p === 'manage_blog');
    expect(labels(result)).toEqual(['Blogs']);
  });

  it('keeps a group when one child is permitted', () => {
    const result = filterNav(ADMIN_NAV, (p) => p === 'manage_roles');
    expect(labels(result)).toEqual(['Users', 'Affiliation roles']);
  });

  it('only references /admin routes', () => {
    const routes = (items: readonly NavItem[]): string[] =>
      items.flatMap((i) => [...(i.route ? [i.route] : []), ...routes(i.children ?? [])]);
    expect(routes(ADMIN_NAV).every((r) => r.startsWith('/admin/'))).toBeTrue();
  });
});
