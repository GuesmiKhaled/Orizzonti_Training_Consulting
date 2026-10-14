import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrizzontiApiService } from '../../services/orizzonti-api.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let api: jasmine.SpyObj<OrizzontiApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<OrizzontiApiService>('OrizzontiApiService', [
      'getBlogs',
      'getAdminUsers',
      'getAdminRoles',
      'getAdminPermissions',
      'getDashboardStats',
    ]);
    api.getBlogs.and.returnValue(of([]));
    api.getAdminUsers.and.returnValue(
      of({ items: [], total: 0, page: 0, size: 20 }),
    );
    api.getAdminRoles.and.returnValue(of([]));
    api.getAdminPermissions.and.returnValue(of([]));
    api.getDashboardStats.and.returnValue(
      of({
        blogsCount: 0,
        coursesCount: 0,
        languagesCount: 0,
        sliderCount: 0,
        courseRequestsCount: 0,
        newCourseRequestsCount: 0,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OrizzontiApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('loads an authorized sidebar section and closes the mobile menu', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    component.profile = {
      id: 1,
      username: 'admin',
      permissions: ['manage_blog'],
    };
    component.sidebarOpen = true;

    component.setActiveSection('blogs');

    expect(component.activeSection).toBe('blogs');
    expect(component.sidebarOpen).toBe(false);
    expect(api.getBlogs).toHaveBeenCalledTimes(1);
    expect(component.isLoading).toBe(false);
  });

  it('ignores navigation to a category the current user cannot manage', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    component.profile = {
      id: 2,
      username: 'content-editor',
      permissions: ['manage_blog'],
    };

    component.setActiveSection('users');

    expect(component.activeSection).toBe('overview');
    expect(api.getAdminUsers).not.toHaveBeenCalled();
  });
});
