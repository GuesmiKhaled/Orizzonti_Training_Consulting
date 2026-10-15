import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { CoursesPageComponent } from './pages/courses-page/courses-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { BlogPageComponent } from './pages/blog-page/blog-page.component';
import { BlogDetailPageComponent } from './pages/blog-detail-page/blog-detail-page.component';
import { LanguageDetailPageComponent } from './pages/language-detail-page/language-detail-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { authGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'courses', component: CoursesPageComponent },
  { path: 'languages/:id', component: LanguageDetailPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'blog', component: BlogPageComponent },
  { path: 'blog/:slug', component: BlogDetailPageComponent },
  { path: 'login', component: AdminLoginPageComponent },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
