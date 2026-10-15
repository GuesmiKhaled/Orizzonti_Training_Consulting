import { Route, Routes } from '@angular/router';
import { permissionGuard } from '../core/auth/auth.guards';
import { AdminLayoutComponent } from './layout/admin-layout.component';

const loadPlaceholder = () =>
  import('./pages/section-placeholder.component').then(
    (m) => m.SectionPlaceholderComponent,
  );

/** A lazy, permission-guarded section. `legacy` deep-links to the classic dashboard. */
function section(
  path: string,
  breadcrumb: string,
  permission: string,
  legacy?: string,
): Route {
  return {
    path,
    ...(path === '' ? { pathMatch: 'full' as const } : {}),
    canMatch: [permissionGuard(permission)],
    loadComponent: loadPlaceholder,
    data: { breadcrumb, legacySection: legacy },
  };
}

function group(
  path: string,
  breadcrumb: string,
  children: Routes,
): Route {
  return { path, data: { breadcrumb }, children };
}

export const ADMIN_ROUTES: Routes = [
  {
    path: 'legacy',
    loadComponent: () =>
      import('../pages/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      section('overview', 'Overview', 'view_dashboard', 'overview'),
      group('users', 'Users', [
        section('', 'Users list', 'manage_users', 'users'),
        section('import', 'Mass import', 'manage_users'),
        section('roles', 'Affiliation roles', 'manage_roles', 'roles'),
      ]),
      group('courses', 'Courses', [
        section('', 'Courses dashboard', 'manage_courses', 'courses'),
      ]),
      group('languages', 'Languages', [
        section('', 'Languages dashboard', 'manage_languages', 'languages'),
        section('levels', 'Levels', 'manage_languages', 'languages'),
        section('exams', 'Exams', 'manage_languages', 'languages'),
        section(
          'registrations',
          'Exam registrations',
          'manage_course_requests',
          'exam-registrations',
        ),
      ]),
      section('blogs', 'Blogs', 'manage_blog', 'blogs'),
      section('media', 'Slider media', 'manage_media', 'media'),
      section('requests', 'Course requests', 'manage_course_requests', 'requests'),
      group('settings', 'Settings', [
        section('site', 'Site settings', 'manage_mail_settings'),
        section('mail', 'Mail settings', 'manage_mail_settings', 'mail'),
      ]),
      {
        path: 'ui-kit',
        canMatch: [permissionGuard('manage_permissions')],
        data: { breadcrumb: 'UI kit' },
        loadComponent: () =>
          import('./pages/ui-kit-demo.component').then(
            (m) => m.UiKitDemoComponent,
          ),
      },
      {
        path: 'forbidden',
        data: { breadcrumb: 'Access denied' },
        loadComponent: () =>
          import('./pages/forbidden.component').then((m) => m.ForbiddenComponent),
      },
      { path: '**', redirectTo: 'overview' },
    ],
  },
];
