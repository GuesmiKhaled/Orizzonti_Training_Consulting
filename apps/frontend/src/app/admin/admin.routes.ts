import { Type } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { permissionGuard } from '../core/auth/auth.guards';
import { AdminLayoutComponent } from './layout/admin-layout.component';

/**
 * A lazy, permission-guarded section. A null breadcrumb leaves the parent's
 * crumb as the last one (used for list pages under a group).
 */
function page(
  path: string,
  breadcrumb: string | null,
  permission: string,
  load: () => Promise<Type<unknown>>,
): Route {
  return {
    path,
    ...(path === '' ? { pathMatch: 'full' as const } : {}),
    canMatch: [permissionGuard(permission)],
    loadComponent: load,
    data: breadcrumb ? { breadcrumb } : {},
  };
}

function group(path: string, breadcrumb: string, children: Routes): Route {
  return { path, data: { breadcrumb }, children };
}

const placeholder = () =>
  import('./pages/section-placeholder.component').then((m) => m.SectionPlaceholderComponent);

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      page('overview', 'Overview', 'view_dashboard', () =>
        import('./overview/overview-page.component').then((m) => m.OverviewPageComponent),
      ),
      group('users', 'Users', [
        page('', 'Users list', 'manage_users', () =>
          import('./users/users-page.component').then((m) => m.UsersPageComponent),
        ),
        page('import', 'Mass import', 'manage_users', placeholder),
        page('roles', 'Affiliation roles', 'manage_roles', () =>
          import('./users/roles/roles-page.component').then((m) => m.RolesPageComponent),
        ),
      ]),
      group('courses', 'Courses', [
        page('', 'Courses dashboard', 'manage_courses', () =>
          import('./courses/courses-page.component').then((m) => m.CoursesPageComponent),
        ),
      ]),
      group('languages', 'Languages', [
        page('', 'Languages dashboard', 'manage_languages', () =>
          import('./languages/languages-dashboard.component').then(
            (m) => m.LanguagesDashboardComponent,
          ),
        ),
        page('levels', 'Levels', 'manage_languages', () =>
          import('./languages/levels-page.component').then((m) => m.LevelsPageComponent),
        ),
        page('exams', 'Exams', 'manage_languages', () =>
          import('./languages/exams-page.component').then((m) => m.ExamsPageComponent),
        ),
        page('registrations', 'Exam registrations', 'manage_course_requests', () =>
          import('./requests/exam-registrations-page.component').then(
            (m) => m.ExamRegistrationsPageComponent,
          ),
        ),
      ]),
      group('blogs', 'Blogs', [
        page('', null, 'manage_blog', () =>
          import('./blogs/blogs-page.component').then((m) => m.BlogsPageComponent),
        ),
        page('new', 'New post', 'manage_blog', () =>
          import('./blogs/blog-editor-page.component').then((m) => m.BlogEditorPageComponent),
        ),
        page(':id', 'Edit post', 'manage_blog', () =>
          import('./blogs/blog-editor-page.component').then((m) => m.BlogEditorPageComponent),
        ),
      ]),
      page('media', 'Slider media', 'manage_media', () =>
        import('./media/media-page.component').then((m) => m.MediaPageComponent),
      ),
      page('requests', 'Course requests', 'manage_course_requests', () =>
        import('./requests/course-requests-page.component').then(
          (m) => m.CourseRequestsPageComponent,
        ),
      ),
      group('settings', 'Settings', [
        page('site', 'Site settings', 'manage_site_settings', () =>
          import('./settings/site-settings-page.component').then(
            (m) => m.SiteSettingsPageComponent,
          ),
        ),
        page('mail', 'Mail settings', 'manage_mail_settings', () =>
          import('./settings/mail-settings-page.component').then(
            (m) => m.MailSettingsPageComponent,
          ),
        ),
      ]),
      {
        path: 'ui-kit',
        canMatch: [permissionGuard('manage_permissions')],
        data: { breadcrumb: 'UI kit' },
        loadComponent: () =>
          import('./pages/ui-kit-demo.component').then((m) => m.UiKitDemoComponent),
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
