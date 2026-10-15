import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdminPermission,
  AdminRole,
  AdminUserPage,
  AuthUser,
  BlogItem,
  CourseItem,
  CourseRequestItem,
  DashboardStats,
  ExamRegistrationItem,
  LanguageItem,
  MailSettings,
  MediaItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="admin-workspace">
      <button
        class="sidebar-backdrop"
        *ngIf="sidebarOpen"
        type="button"
        aria-label="Close navigation"
        (click)="sidebarOpen = false"
      ></button>
      <aside class="admin-sidebar" [class.open]="sidebarOpen">
        <a
          class="sidebar-brand"
          routerLink="/"
          aria-label="Orizzonti public website"
        >
          <img
            src="/img/log_orizzonti.png"
            alt="Orizzonti Training & Consulting"
          />
        </a>
        <p class="sidebar-caption">BACKOFFICE</p>
        <nav aria-label="Backoffice categories">
          <button
            type="button"
            [class.active]="activeSection === 'overview'"
            *ngIf="canManage('view_dashboard')"
            (click)="setActiveSection('overview')"
          >
            <i class="fa fa-chart-pie" aria-hidden="true"></i
            ><span>Overview</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'users'"
            *ngIf="canManage('manage_users')"
            (click)="setActiveSection('users')"
          >
            <i class="fa fa-users" aria-hidden="true"></i><span>Users</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'roles'"
            *ngIf="canManage('manage_roles')"
            (click)="setActiveSection('roles')"
          >
            <i class="fa fa-shield-alt" aria-hidden="true"></i
            ><span>Roles &amp; permissions</span>
          </button>
          <div class="sidebar-divider"></div>
          <button
            type="button"
            [class.active]="activeSection === 'blogs'"
            *ngIf="canManage('manage_blog')"
            (click)="setActiveSection('blogs')"
          >
            <i class="fa fa-newspaper" aria-hidden="true"></i><span>Blogs</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'courses'"
            *ngIf="canManage('manage_courses')"
            (click)="setActiveSection('courses')"
          >
            <i class="fa fa-book-open" aria-hidden="true"></i
            ><span>Courses</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'languages'"
            *ngIf="canManage('manage_languages')"
            (click)="setActiveSection('languages')"
          >
            <i class="fa fa-language" aria-hidden="true"></i
            ><span>Languages</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'media'"
            *ngIf="canManage('manage_media')"
            (click)="setActiveSection('media')"
          >
            <i class="fa fa-images" aria-hidden="true"></i
            ><span>Slider media</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'requests'"
            *ngIf="canManage('manage_course_requests')"
            (click)="setActiveSection('requests')"
          >
            <i class="fa fa-inbox" aria-hidden="true"></i
            ><span>Course requests</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'exam-registrations'"
            *ngIf="canManage('manage_course_requests')"
            (click)="setActiveSection('exam-registrations')"
          >
            <i class="fa fa-user-check" aria-hidden="true"></i
            ><span>Exam registrations</span>
          </button>
          <button
            type="button"
            [class.active]="activeSection === 'mail'"
            *ngIf="canManage('manage_mail_settings')"
            (click)="setActiveSection('mail')"
          >
            <i class="fa fa-envelope" aria-hidden="true"></i
            ><span>Mail settings</span>
          </button>
        </nav>
        <button type="button" class="sidebar-logout" (click)="logout()">
          <i class="fa fa-sign-out-alt" aria-hidden="true"></i>Sign out
        </button>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <button
            type="button"
            class="menu-toggle"
            aria-label="Open navigation"
            [attr.aria-expanded]="sidebarOpen"
            (click)="sidebarOpen = !sidebarOpen"
          >
            <i class="fa fa-bars" aria-hidden="true"></i>
          </button>
          <div class="topbar-user" *ngIf="profile">
            <div class="topbar-user-text">
              <span>{{ profile.username }}</span
              ><span class="role-label">{{ profile.role }}</span>
            </div>
            <span class="avatar" aria-hidden="true">{{
              profile.username.slice(0, 2).toUpperCase()
            }}</span>
          </div>
        </header>
        <nav class="admin-breadcrumb" aria-label="breadcrumb">
          <span>Backoffice</span><span class="sep">/</span
          ><strong>{{ sectionTitle }}</strong>
        </nav>

        <main class="workspace-content">
          <div
            class="status"
            *ngIf="statusMessage"
            [class.error]="isError"
            role="status"
          >
            {{ statusMessage }}
          </div>

          <section
            *ngIf="activeSection === 'overview' && canManage('view_dashboard')"
            class="overview-section"
          >
            <div class="stats" *ngIf="!isLoading">
              <div class="stat-item">
                <strong>Blogs</strong><span>{{ stats.blogsCount }}</span>
              </div>
              <div class="stat-item">
                <strong>Courses</strong><span>{{ stats.coursesCount }}</span>
              </div>
              <div class="stat-item">
                <strong>Languages</strong
                ><span>{{ stats.languagesCount }}</span>
              </div>
              <div class="stat-item">
                <strong>Slider images</strong
                ><span>{{ stats.sliderCount }}</span>
              </div>
              <div class="stat-item">
                <strong>Course requests</strong
                ><span>{{ stats.courseRequestsCount }}</span>
              </div>
              <div class="stat-item">
                <strong>New requests</strong
                ><span>{{ stats.newCourseRequestsCount }}</span>
              </div>
            </div>
            <p *ngIf="isLoading" class="loading-state">
              Loading dashboard data...
            </p>
          </section>

          <div class="panel-grid">
            <article
              class="panel full-width"
              *ngIf="activeSection === 'users' && canManage('manage_users')"
            >
              <div class="section-heading">
                <div>
                  <h2>Admin users</h2>
                  <p>Manage backoffice access and role assignments.</p>
                </div>
                <span>{{ usersPage?.total ?? 0 }} users</span>
              </div>
              <div class="table-toolbar">
                <input
                  aria-label="Search admin users"
                  placeholder="Search usernames"
                  [value]="userSearch"
                  (input)="searchUsers($event)"
                /><button type="button" class="ghost" (click)="resetUserForm()">
                  New user
                </button>
              </div>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let user of usersPage?.items">
                      <td>{{ user.username }}</td>
                      <td>{{ user.role || 'No role' }}</td>
                      <td>
                        <span
                          class="state-pill"
                          [class.inactive]="!user.isActive"
                          >{{ user.isActive ? 'Active' : 'Inactive' }}</span
                        >
                      </td>
                      <td class="actions">
                        <button
                          type="button"
                          class="ghost"
                          (click)="editAdminUser(user)"
                        >
                          Edit</button
                        ><button
                          type="button"
                          class="ghost"
                          [disabled]="user.id === profile?.id"
                          (click)="toggleAdminUser(user)"
                        >
                          {{
                            user.isActive ? 'Deactivate' : 'Activate'
                          }}</button
                        ><button
                          type="button"
                          class="danger"
                          [disabled]="user.id === profile?.id"
                          (click)="deleteAdminUser(user)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!usersPage?.items?.length">
                      <td colspan="4" class="empty-cell">
                        {{ isLoading ? 'Loading users...' : 'No users found.' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pagination">
                <span
                  >Page {{ (usersPage?.page ?? 0) + 1 }} of
                  {{ totalUserPages }}</span
                >
                <div>
                  <button
                    type="button"
                    class="ghost"
                    [disabled]="(usersPage?.page ?? 0) <= 0"
                    (click)="changeUserPage(-1)"
                  >
                    Previous</button
                  ><button
                    type="button"
                    class="ghost"
                    [disabled]="(usersPage?.page ?? 0) + 1 >= totalUserPages"
                    (click)="changeUserPage(1)"
                  >
                    Next
                  </button>
                </div>
              </div>
              <form
                class="editor-form"
                [formGroup]="userForm"
                (ngSubmit)="saveAdminUser()"
              >
                <h3>
                  {{ userForm.get('id')?.value ? 'Edit user' : 'Create user' }}
                </h3>
                <div class="form-grid">
                  <label
                    >Username<input
                      formControlName="username"
                      autocomplete="off" /></label
                  ><label
                    >{{
                      userForm.get('id')?.value
                        ? 'New password (optional)'
                        : 'Password'
                    }}<input
                      type="password"
                      formControlName="password"
                      autocomplete="new-password" /></label
                  ><label
                    >Role<select formControlName="roleId">
                      <option [ngValue]="null">Choose a role</option>
                      <option *ngFor="let role of roles" [ngValue]="role.id">
                        {{ role.name }}
                      </option>
                    </select></label
                  ><label class="checkbox-row"
                    ><input
                      type="checkbox"
                      formControlName="isActive"
                    />Active</label
                  >
                </div>
                <div class="actions">
                  <button
                    type="submit"
                    [disabled]="userForm.invalid || isSubmitting"
                  >
                    {{
                      userForm.get('id')?.value ? 'Save user' : 'Create user'
                    }}</button
                  ><button
                    type="button"
                    class="ghost"
                    (click)="resetUserForm()"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </article>

            <article
              class="panel full-width"
              *ngIf="activeSection === 'roles' && canManage('manage_roles')"
            >
              <div class="section-heading">
                <div>
                  <h2>Roles &amp; permissions</h2>
                  <p>Assign permission sets to backoffice roles.</p>
                </div>
              </div>
              <div class="roles-layout">
                <ul class="role-list">
                  <li
                    *ngFor="let role of roles"
                    [class.selected]="selectedRole?.id === role.id"
                  >
                    <button type="button" (click)="editRole(role)">
                      <strong>{{ role.name }}</strong
                      ><small>{{ role.description || 'No description' }}</small
                      ><span
                        >{{ role.permissions.length }} permissions</span
                      ></button
                    ><button
                      *ngIf="role.name !== 'super-admin'"
                      type="button"
                      class="danger icon-button"
                      [attr.aria-label]="'Delete ' + role.name"
                      (click)="deleteAdminRole(role)"
                    >
                      <i class="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </li>
                </ul>
                <form
                  class="editor-form"
                  [formGroup]="roleForm"
                  (ngSubmit)="saveAdminRole()"
                >
                  <h3>
                    {{
                      roleForm.get('id')?.value ? 'Edit role' : 'Create role'
                    }}
                  </h3>
                  <div class="form-grid">
                    <label>Role name<input formControlName="name" /></label
                    ><label
                      >Description<input formControlName="description"
                    /></label>
                  </div>
                  <fieldset>
                    <legend>Permissions</legend>
                    <label
                      class="permission-row"
                      *ngFor="let permission of permissions"
                      ><input
                        type="checkbox"
                        [checked]="
                          selectedPermissionIds.includes(permission.id)
                        "
                        (change)="toggleRolePermission(permission.id, $event)"
                      /><span
                        ><strong>{{ permission.name }}</strong
                        ><small>{{ permission.description }}</small></span
                      ></label
                    >
                  </fieldset>
                  <div class="actions">
                    <button
                      type="submit"
                      [disabled]="roleForm.invalid || isSubmitting"
                    >
                      {{
                        roleForm.get('id')?.value ? 'Save role' : 'Create role'
                      }}</button
                    ><button
                      type="button"
                      class="ghost"
                      (click)="resetRoleForm()"
                    >
                      New role
                    </button>
                  </div>
                </form>
              </div>
            </article>

            <article
              class="panel"
              *ngIf="
                activeSection === 'mail' && canManage('manage_mail_settings')
              "
            >
              <h3>Mail settings</h3>
              <form [formGroup]="mailForm" (ngSubmit)="saveMailSettings()">
                <label>
                  <span>SMTP host</span>
                  <input formControlName="host" />
                </label>
                <div class="row two-col">
                  <label>
                    <span>Port</span>
                    <input type="number" formControlName="port" />
                  </label>
                  <label class="checkbox-row">
                    <input type="checkbox" formControlName="secure" />
                    <span>Use secure SMTP</span>
                  </label>
                </div>
                <label>
                  <span>Username</span>
                  <input formControlName="username" />
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" formControlName="password" />
                </label>
                <label>
                  <span>From address</span>
                  <input formControlName="fromAddress" />
                </label>
                <button
                  type="submit"
                  [disabled]="mailForm.invalid || isSubmitting"
                >
                  Save mail settings
                </button>
              </form>
            </article>

            <article
              class="panel"
              *ngIf="activeSection === 'blogs' && canManage('manage_blog')"
            >
              <h3>Blog manager</h3>
              <ul class="list" *ngIf="blogs.length; else emptyBlogs">
                <li *ngFor="let blog of blogs">
                  <span>{{ blog.title }}</span>
                  <div class="actions">
                    <button
                      type="button"
                      class="ghost"
                      (click)="loadBlogForEdit(blog)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteBlog(blog.id!)"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              </ul>
              <ng-template #emptyBlogs
                ><p class="empty-state">No blogs saved yet.</p></ng-template
              >
              <form [formGroup]="blogForm" (ngSubmit)="saveBlog()">
                <label>
                  <span>Title</span>
                  <input formControlName="title" />
                </label>
                <label>
                  <span>Excerpt</span>
                  <textarea formControlName="excerpt" rows="3"></textarea>
                </label>
                <label>
                  <span>Content</span>
                  <textarea formControlName="content" rows="8"></textarea>
                </label>
                <label>
                  <span>Slug</span>
                  <input formControlName="slug" />
                </label>
                <label>
                  <span>Image URL</span>
                  <input formControlName="imageUrl" placeholder="/img/blog/blog_bg.jpg" />
                </label>
                <button
                  type="submit"
                  [disabled]="blogForm.invalid || isSubmitting"
                >
                  {{ blogForm.get('id')?.value ? 'Update blog' : 'Add blog' }}
                </button>
              </form>
            </article>

            <article
              class="panel"
              *ngIf="activeSection === 'courses' && canManage('manage_courses')"
            >
              <h3>Course manager</h3>
              <ul class="list" *ngIf="courses.length; else emptyCourses">
                <li *ngFor="let course of courses">
                  <span>{{ course.name }}</span>
                  <div class="actions">
                    <button
                      type="button"
                      class="ghost"
                      (click)="loadCourseForEdit(course)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteCourse(course.id!)"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              </ul>
              <ng-template #emptyCourses
                ><p class="empty-state">No courses saved yet.</p></ng-template
              >
              <form [formGroup]="courseForm" (ngSubmit)="saveCourse()">
                <label>
                  <span>Name</span>
                  <input formControlName="name" />
                </label>
                <label>
                  <span>Description</span>
                  <textarea formControlName="description" rows="3"></textarea>
                </label>
                <div class="row two-col">
                  <label>
                    <span>Price</span>
                    <input formControlName="price" />
                  </label>
                  <label>
                    <span>Slug</span>
                    <input formControlName="slug" />
                  </label>
                </div>
                <label>
                  <span>Image URL</span>
                  <input formControlName="imageUrl" placeholder="/img/italien/italian.jpg" />
                </label>
                <button
                  type="submit"
                  [disabled]="courseForm.invalid || isSubmitting"
                >
                  {{
                    courseForm.get('id')?.value ? 'Update course' : 'Add course'
                  }}
                </button>
              </form>
            </article>

            <article
              class="panel"
              *ngIf="
                activeSection === 'languages' && canManage('manage_languages')
              "
            >
              <h3>Language manager</h3>
              <ul class="list" *ngIf="languages.length; else emptyLanguages">
                <li *ngFor="let language of languages">
                  <div>
                    <span>{{ language.name }} ({{ language.code }})</span>
                    <small *ngIf="language.isActive" class="state-pill">Active</small>
                    <small *ngIf="!language.isActive" class="state-pill inactive">Inactive</small>
                  </div>
                  <div class="actions">
                    <button
                      type="button"
                      class="ghost"
                      (click)="loadLanguageForEdit(language)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="ghost"
                      (click)="expandLanguageDetails(language.id!)"
                    >
                      {{ expandedLanguageId === language.id ? 'Hide' : 'Manage' }} Levels & Exams
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteLanguage(language.id!)"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              </ul>
              <ng-template #emptyLanguages
                ><p class="empty-state">No languages saved yet.</p></ng-template
              >

              <!-- Language Details Expansion -->
              <div
                *ngIf="expandedLanguageId && selectedLanguageForDetails"
                class="language-details-panel"
              >
                <h4>{{ selectedLanguageForDetails.name }} - CEFR Levels & Exams</h4>

                <!-- Language Levels Section -->
                <div class="subsection">
                  <h5>Language Levels</h5>
                  <div class="table-scroll">
                    <table *ngIf="languageLevels.length; else noLevels">
                      <thead>
                        <tr>
                          <th>CEFR Level</th>
                          <th>Course Hours</th>
                          <th>Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let level of languageLevels">
                          <td>{{ level.cefrLevel }}</td>
                          <td>{{ level.courseHours }} hours</td>
                          <td>{{ level.price | currency }}</td>
                          <td class="actions">
                            <button
                              type="button"
                              class="ghost"
                              (click)="loadLevelForEdit(level)"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              class="danger"
                              (click)="deleteLanguageLevel(level.id!)"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <ng-template #noLevels
                      ><p class="empty-state">No levels added yet.</p></ng-template
                    >
                  </div>

                  <!-- Level Form -->
                  <form [formGroup]="levelForm" (ngSubmit)="saveLanguageLevel()">
                    <h6>{{ levelForm.get('id')?.value ? 'Edit' : 'Add' }} Level</h6>
                    <div class="form-grid">
                      <label>
                        <span>CEFR Level</span>
                        <select formControlName="cefrLevel">
                          <option [ngValue]="null">Choose level</option>
                          <option value="A1">A1 - Beginner</option>
                          <option value="A2">A2 - Elementary</option>
                          <option value="B1">B1 - Intermediate</option>
                          <option value="B2">B2 - Upper Intermediate</option>
                          <option value="C1">C1 - Advanced</option>
                          <option value="C2">C2 - Mastery</option>
                        </select>
                      </label>
                      <label>
                        <span>Course Hours</span>
                        <input
                          type="number"
                          formControlName="courseHours"
                          min="1"
                        />
                      </label>
                      <label>
                        <span>Price</span>
                        <input
                          type="number"
                          formControlName="price"
                          min="0"
                          step="0.01"
                        />
                      </label>
                    </div>
                    <div class="actions">
                      <button
                        type="submit"
                        [disabled]="levelForm.invalid || isSubmitting"
                      >
                        {{
                          levelForm.get('id')?.value
                            ? 'Update level'
                            : 'Add level'
                        }}
                      </button>
                      <button
                        type="button"
                        class="ghost"
                        (click)="resetLevelForm()"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>

                <!-- Exam Sessions Section -->
                <div class="subsection">
                  <h5>Exam Sessions</h5>
                  <div class="table-scroll">
                    <table *ngIf="examSessions.length; else noExams">
                      <thead>
                        <tr>
                          <th>Level</th>
                          <th>Exam Date</th>
                          <th>Registration Deadline</th>
                          <th>Places</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let exam of examSessions">
                          <td>{{ exam.languageLevel?.cefrLevel }}</td>
                          <td>{{ exam.examDate | date: 'short' }}</td>
                          <td>{{ exam.registrationDeadline | date: 'short' }}</td>
                          <td>
                            {{ exam.maxParticipants ?? 'Unlimited' }}
                            <small *ngIf="exam.placesLeft != null"
                              >({{ exam.placesLeft }} left)</small
                            >
                          </td>
                          <td class="actions">
                            <button
                              type="button"
                              class="ghost"
                              (click)="loadExamForEdit(exam)"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              class="danger"
                              (click)="deleteExamSession(exam.id!)"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <ng-template #noExams
                      ><p class="empty-state">No exams scheduled yet.</p></ng-template
                    >
                  </div>

                  <!-- Exam Form -->
                  <form [formGroup]="examForm" (ngSubmit)="saveExamSession()">
                    <h6>{{ examForm.get('id')?.value ? 'Edit' : 'Add' }} Exam</h6>
                    <div class="form-grid">
                      <label>
                        <span>Level</span>
                        <select formControlName="languageLevelId">
                          <option [ngValue]="null">Choose level</option>
                          <option
                            *ngFor="let level of languageLevels"
                            [ngValue]="level.id"
                          >
                            {{ level.cefrLevel }}
                          </option>
                        </select>
                      </label>
                      <label>
                        <span>Exam Date</span>
                        <input type="datetime-local" formControlName="examDate" />
                      </label>
                      <label>
                        <span>Registration Start</span>
                        <input
                          type="datetime-local"
                          formControlName="registrationStartDate"
                        />
                      </label>
                      <label>
                        <span>Registration Deadline</span>
                        <input
                          type="datetime-local"
                          formControlName="registrationDeadline"
                        />
                      </label>
                      <label>
                        <span>Subscription URL</span>
                        <input
                          type="url"
                          formControlName="subscriptionUrl"
                          placeholder="https://..."
                        />
                      </label>
                      <label>
                        <span>Max Participants (empty = unlimited)</span>
                        <input
                          type="number"
                          formControlName="maxParticipants"
                          min="1"
                        />
                      </label>
                    </div>
                    <div class="actions">
                      <button
                        type="submit"
                        [disabled]="examForm.invalid || isSubmitting"
                      >
                        {{
                          examForm.get('id')?.value
                            ? 'Update exam'
                            : 'Add exam'
                        }}
                      </button>
                      <button
                        type="button"
                        class="ghost"
                        (click)="resetExamForm()"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Main Language Form -->
              <form [formGroup]="languageForm" (ngSubmit)="saveLanguage()">
                <h4>{{ languageForm.get('id')?.value ? 'Edit' : 'Add' }} Language</h4>
                <div class="row two-col">
                  <label>
                    <span>Name</span>
                    <input formControlName="name" />
                  </label>
                  <label>
                    <span>Code</span>
                    <input formControlName="code" />
                  </label>
                </div>
                <label>
                  <span>Native name</span>
                  <input formControlName="nativeName" />
                </label>
                <label class="checkbox-row">
                  <input type="checkbox" formControlName="isActive" />
                  <span>Active</span>
                </label>
                <div class="actions">
                  <button
                    type="submit"
                    [disabled]="languageForm.invalid || isSubmitting"
                  >
                    {{
                      languageForm.get('id')?.value
                        ? 'Update language'
                        : 'Add language'
                    }}
                  </button>
                  <button
                    type="button"
                    class="ghost"
                    (click)="resetLanguageForm()"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </article>

            <article
              class="panel full-width"
              *ngIf="
                activeSection === 'requests' &&
                canManage('manage_course_requests')
              "
            >
              <h3>Course requests</h3>
              <ul
                class="list"
                *ngIf="courseRequests.length; else emptyCourseRequests"
              >
                <li *ngFor="let request of courseRequests">
                  <div>
                    <strong>{{ request.fullName }}</strong>
                    <div>{{ request.courseName }}</div>
                    <small
                      >{{ request.email }} ·
                      {{ request.status || 'new' }}</small
                    >
                  </div>
                  <div class="actions">
                    <button
                      type="button"
                      class="ghost"
                      (click)="
                        updateCourseRequestStatus(request.id!, 'reviewed')
                      "
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteCourseRequest(request.id!)"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              </ul>
              <ng-template #emptyCourseRequests>
                <p class="empty-state">No course requests yet.</p>
              </ng-template>
            </article>

            <article
              class="panel full-width"
              *ngIf="
                activeSection === 'exam-registrations' &&
                canManage('manage_course_requests')
              "
            >
              <div class="section-heading">
                <div>
                  <h2>Exam registrations</h2>
                  <p>
                    Accept or reject requests. Pending and accepted requests
                    hold a place.
                  </p>
                </div>
                <span>{{ examRegistrations.length }} requests</span>
              </div>
              <div class="table-toolbar">
                <select
                  aria-label="Filter by status"
                  [value]="registrationFilter"
                  (change)="filterRegistrations($event)"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Exam</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let registration of examRegistrations">
                      <td>
                        <strong>{{ registration.fullName }}</strong
                        ><br /><small
                          >{{ registration.email
                          }}<span *ngIf="registration.phone">
                            · {{ registration.phone }}</span
                          ></small
                        >
                        <br /><small *ngIf="registration.message">{{
                          registration.message
                        }}</small>
                      </td>
                      <td>
                        {{ registration.languageName }}
                        {{ registration.cefrLevel }}<br /><small
                          >{{ registration.examDate | date: 'dd.MM.yyyy' }}
                          {{ registration.location }}</small
                        >
                      </td>
                      <td>
                        <span
                          class="state-pill"
                          [class.inactive]="registration.status !== 'accepted'"
                          >{{ registration.status }}</span
                        >
                      </td>
                      <td class="actions">
                        <button
                          type="button"
                          class="ghost"
                          [disabled]="registration.status === 'accepted'"
                          (click)="setRegistrationStatus(registration, 'accepted')"
                        >
                          Accept</button
                        ><button
                          type="button"
                          class="ghost"
                          [disabled]="registration.status === 'rejected'"
                          (click)="setRegistrationStatus(registration, 'rejected')"
                        >
                          Reject</button
                        ><button
                          type="button"
                          class="danger"
                          (click)="deleteRegistration(registration)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!examRegistrations.length">
                      <td colspan="4" class="empty-cell">
                        {{
                          isLoading
                            ? 'Loading registrations...'
                            : 'No registrations found.'
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article
              class="panel full-width"
              *ngIf="activeSection === 'media' && canManage('manage_media')"
            >
              <h3>Slider media</h3>
              <ul class="list" *ngIf="media.length; else emptyMedia">
                <li *ngFor="let item of media">
                  <span>{{ item.title }}</span>
                  <div class="actions">
                    <button
                      type="button"
                      class="ghost"
                      (click)="loadMediaForEdit(item)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="danger"
                      (click)="deleteMedia(item.id!)"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              </ul>
              <ng-template #emptyMedia
                ><p class="empty-state">No slider images yet.</p></ng-template
              >
              <form [formGroup]="mediaForm" (ngSubmit)="saveMedia()">
                <label>
                  <span>Title</span>
                  <input formControlName="title" />
                </label>
                <label>
                  <span>Image URL</span>
                  <input formControlName="imageUrl" />
                </label>
                <label>
                  <span>Alt text</span>
                  <input formControlName="altText" />
                </label>
                <label class="checkbox-row">
                  <input type="checkbox" formControlName="isActive" />
                  <span>Visible in slider</span>
                </label>
                <button
                  type="submit"
                  [disabled]="mediaForm.invalid || isSubmitting"
                >
                  {{
                    mediaForm.get('id')?.value ? 'Update image' : 'Add image'
                  }}
                </button>
              </form>
            </article>
          </div>
        </main>
      </div>
    </section>
  `,
})
export class AdminDashboardComponent implements OnInit {
  readonly mailForm: FormGroup;
  readonly blogForm: FormGroup;
  readonly courseForm: FormGroup;
  readonly languageForm: FormGroup;
  readonly levelForm: FormGroup;
  readonly examForm: FormGroup;
  readonly mediaForm: FormGroup;
  readonly userForm: FormGroup;
  readonly roleForm: FormGroup;

  blogs: BlogItem[] = [];
  courses: CourseItem[] = [];
  languages: LanguageItem[] = [];
  languageLevels: any[] = [];
  examSessions: any[] = [];
  media: MediaItem[] = [];
  courseRequests: CourseRequestItem[] = [];
  examRegistrations: ExamRegistrationItem[] = [];
  registrationFilter = '';
  usersPage: AdminUserPage | null = null;
  roles: AdminRole[] = [];
  permissions: AdminPermission[] = [];
  selectedRole: AdminRole | null = null;
  selectedPermissionIds: number[] = [];
  profile: AuthUser | null = null;
  activeSection = 'overview';
  sidebarOpen = false;
  userSearch = '';
  expandedLanguageId: number | null = null;
  selectedLanguageForDetails: LanguageItem | null = null;
  private userPage = 0;
  stats: DashboardStats = {
    blogsCount: 0,
    coursesCount: 0,
    languagesCount: 0,
    sliderCount: 0,
    courseRequestsCount: 0,
    newCourseRequestsCount: 0,
  };
  isLoading = true;
  isSubmitting = false;
  isError = false;
  statusMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: OrizzontiApiService,
    private readonly router: Router,
  ) {
    this.mailForm = this.fb.group({
      id: [null],
      host: ['', Validators.required],
      port: [587, [Validators.required, Validators.min(1)]],
      username: ['', Validators.required],
      password: [''],
      fromAddress: ['', Validators.required],
      secure: [true],
    });

    this.blogForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      excerpt: ['', Validators.required],
      slug: [''],
      imageUrl: [''],
      content: [''],
    });

    this.courseForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [''],
      slug: [''],
      imageUrl: [''],
    });

    this.languageForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      code: ['', Validators.required],
      nativeName: [''],
      isActive: [true],
    });

    this.levelForm = this.fb.group({
      id: [null],
      cefrLevel: ['', Validators.required],
      courseHours: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]],
    });

    this.examForm = this.fb.group({
      id: [null],
      languageLevelId: ['', Validators.required],
      examDate: ['', Validators.required],
      registrationStartDate: ['', Validators.required],
      registrationDeadline: ['', Validators.required],
      subscriptionUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      maxParticipants: [null],
    });

    this.mediaForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      imageUrl: ['', Validators.required],
      altText: [''],
      isActive: [true],
    });

    this.userForm = this.fb.group({
      id: [null],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      roleId: [null, Validators.required],
      isActive: [true],
    });

    this.roleForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private setStatus(message: string, isError = false): void {
    this.statusMessage = message;
    this.isError = isError;
  }

  private loadDashboard(): void {
    this.apiService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        const firstSection = [
          'overview',
          'users',
          'roles',
          'blogs',
          'courses',
          'languages',
          'media',
          'requests',
          'exam-registrations',
          'mail',
        ].find((section) => this.hasSectionPermission(section));
        const requested: unknown = this.router.parseUrl(this.router.url)
          .queryParams['section'];
        this.activeSection =
          typeof requested === 'string' && this.hasSectionPermission(requested)
            ? requested
            : (firstSection ?? 'overview');
        this.loadSection();
      },
      error: () => {
        this.isLoading = false;
        this.apiService.logout();
        this.router.navigateByUrl('/login');
      },
    });
  }

  get sectionTitle(): string {
    return (
      {
        overview: 'Overview',
        users: 'Users',
        roles: 'Roles & permissions',
        blogs: 'Blogs',
        courses: 'Courses',
        languages: 'Languages',
        media: 'Slider media',
        requests: 'Course requests',
        'exam-registrations': 'Exam registrations',
        mail: 'Mail settings',
      }[this.activeSection] ?? 'Admin dashboard'
    );
  }

  canManage(permission: string): boolean {
    return this.profile?.permissions?.includes(permission) ?? false;
  }

  get totalUserPages(): number {
    return Math.max(1, Math.ceil((this.usersPage?.total ?? 0) / 20));
  }

  private hasSectionPermission(section: string): boolean {
    const permissions: Record<string, string> = {
      overview: 'view_dashboard',
      users: 'manage_users',
      roles: 'manage_roles',
      blogs: 'manage_blog',
      courses: 'manage_courses',
      languages: 'manage_languages',
      media: 'manage_media',
      requests: 'manage_course_requests',
      'exam-registrations': 'manage_course_requests',
      mail: 'manage_mail_settings',
    };
    return this.canManage(permissions[section] ?? '');
  }

  setActiveSection(section: string): void {
    if (!this.hasSectionPermission(section)) return;
    this.activeSection = section;
    this.sidebarOpen = false;
    this.statusMessage = '';
    this.loadSection();
  }

  private loadSection(): void {
    this.isLoading = true;
    switch (this.activeSection) {
      case 'overview':
        this.apiService.getDashboardStats().subscribe({
          next: (stats) => {
            this.stats = stats;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load dashboard statistics.'),
        });
        break;
      case 'users':
        this.loadUsers();
        this.loadRoles();
        break;
      case 'roles':
        this.loadRolesAndPermissions();
        break;
      case 'blogs':
        this.apiService.getBlogs().subscribe({
          next: (items) => {
            this.blogs = items;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load blogs.'),
        });
        break;
      case 'courses':
        this.apiService.getCourses().subscribe({
          next: (items) => {
            this.courses = items;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load courses.'),
        });
        break;
      case 'languages':
        this.apiService.getLanguages().subscribe({
          next: (items) => {
            this.languages = items;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load languages.'),
        });
        break;
      case 'media':
        this.apiService.getMedia().subscribe({
          next: (items) => {
            this.media = items;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load slider media.'),
        });
        break;
      case 'requests':
        this.apiService.getCourseRequests().subscribe({
          next: (items) => {
            this.courseRequests = items;
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load course requests.'),
        });
        break;
      case 'exam-registrations':
        this.apiService
          .getExamRegistrations(this.registrationFilter)
          .subscribe({
            next: (items) => {
              this.examRegistrations = items;
              this.isLoading = false;
            },
            error: () => this.loadError('Unable to load exam registrations.'),
          });
        break;
      case 'mail':
        this.apiService.getMailSettings().subscribe({
          next: (mail) => {
            this.mailForm.patchValue({ ...mail, password: '' });
            this.isLoading = false;
          },
          error: () => this.loadError('Unable to load mail settings.'),
        });
        break;
      default:
        this.isLoading = false;
    }
  }

  private loadError(message: string): void {
    this.isLoading = false;
    this.setStatus(message, true);
  }

  private loadUsers(): void {
    this.apiService
      .getAdminUsers(this.userPage, 20, this.userSearch)
      .subscribe({
        next: (users) => {
          this.usersPage = users;
          this.isLoading = false;
        },
        error: () => this.loadError('Unable to load admin users.'),
      });
  }

  private loadRoles(): void {
    this.apiService.getAdminRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: () => this.setStatus('Unable to load roles.', true),
    });
  }

  private loadRolesAndPermissions(): void {
    forkJoin({
      roles: this.apiService.getAdminRoles(),
      permissions: this.apiService.getAdminPermissions(),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles = roles;
        this.permissions = permissions;
        this.isLoading = false;
      },
      error: () => this.loadError('Unable to load roles and permissions.'),
    });
  }

  searchUsers(event: Event): void {
    this.userSearch = (event.target as HTMLInputElement).value;
    this.userPage = 0;
    this.loadUsers();
  }

  changeUserPage(direction: number): void {
    this.userPage = Math.max(
      0,
      Math.min(this.totalUserPages - 1, this.userPage + direction),
    );
    this.loadUsers();
  }

  resetUserForm(): void {
    this.userForm.reset({
      id: null,
      username: '',
      password: '',
      roleId: null,
      isActive: true,
    });
    this.userForm.controls['password'].setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.userForm.controls['password'].updateValueAndValidity();
  }

  editAdminUser(user: AuthUser): void {
    this.userForm.patchValue({
      id: user.id,
      username: user.username,
      password: '',
      roleId: user.roleId ?? null,
      isActive: user.isActive ?? true,
    });
    this.userForm.controls['password'].clearValidators();
    this.userForm.controls['password'].setValidators(Validators.minLength(8));
    this.userForm.controls['password'].updateValueAndValidity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveAdminUser(): void {
    if (this.userForm.invalid || this.isSubmitting) return;
    const { id, ...formValue } = this.userForm.value;
    const payload = {
      ...formValue,
      ...(formValue.password ? {} : { password: undefined }),
    };
    this.isSubmitting = true;
    const request = id
      ? this.apiService.updateAdminUser(id, payload)
      : this.apiService.createAdminUser(payload);
    request.subscribe({
      next: () => {
        this.setStatus(id ? 'Admin user updated.' : 'Admin user created.');
        this.isSubmitting = false;
        this.resetUserForm();
        this.loadUsers();
      },
      error: (error) => {
        this.setStatus(
          error?.error?.message ?? 'Unable to save admin user.',
          true,
        );
        this.isSubmitting = false;
      },
    });
  }

  toggleAdminUser(user: AuthUser): void {
    if (!user.id || user.id === this.profile?.id || this.isSubmitting) return;
    this.isSubmitting = true;
    this.apiService
      .updateAdminUser(user.id, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          this.setStatus(
            user.isActive ? 'User deactivated.' : 'User activated.',
          );
          this.isSubmitting = false;
          this.loadUsers();
        },
        error: (error) => {
          this.setStatus(
            error?.error?.message ?? 'Unable to update user status.',
            true,
          );
          this.isSubmitting = false;
        },
      });
  }

  deleteAdminUser(user: AuthUser): void {
    if (
      !user.id ||
      user.id === this.profile?.id ||
      this.isSubmitting ||
      !window.confirm(`Delete admin user ${user.username}?`)
    )
      return;
    this.isSubmitting = true;
    this.apiService.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.setStatus('Admin user deleted.');
        this.isSubmitting = false;
        this.loadUsers();
      },
      error: (error) => {
        this.setStatus(
          error?.error?.message ?? 'Unable to delete admin user.',
          true,
        );
        this.isSubmitting = false;
      },
    });
  }

  editRole(role: AdminRole): void {
    this.selectedRole = role;
    this.selectedPermissionIds = role.permissions.map(({ id }) => id);
    this.roleForm.patchValue({
      id: role.id,
      name: role.name,
      description: role.description ?? '',
    });
  }

  resetRoleForm(): void {
    this.selectedRole = null;
    this.selectedPermissionIds = [];
    this.roleForm.reset({ id: null, name: '', description: '' });
  }

  toggleRolePermission(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedPermissionIds = checked
      ? [...new Set([...this.selectedPermissionIds, id])]
      : this.selectedPermissionIds.filter(
          (permissionId) => permissionId !== id,
        );
  }

  saveAdminRole(): void {
    if (this.roleForm.invalid || this.isSubmitting) return;
    const { id, ...formValue } = this.roleForm.value;
    const payload = {
      ...formValue,
      permissionIds: this.selectedPermissionIds,
    };
    this.isSubmitting = true;
    const request = id
      ? this.apiService.updateAdminRole(id, payload)
      : this.apiService.createAdminRole(payload);
    request.subscribe({
      next: () => {
        this.setStatus(id ? 'Role updated.' : 'Role created.');
        this.isSubmitting = false;
        this.resetRoleForm();
        this.loadRolesAndPermissions();
      },
      error: (error) => {
        this.setStatus(error?.error?.message ?? 'Unable to save role.', true);
        this.isSubmitting = false;
      },
    });
  }

  deleteAdminRole(role: AdminRole): void {
    if (
      role.name === 'super-admin' ||
      this.isSubmitting ||
      !window.confirm(`Delete role ${role.name}?`)
    )
      return;
    this.isSubmitting = true;
    this.apiService.deleteAdminRole(role.id).subscribe({
      next: () => {
        this.setStatus('Role deleted.');
        this.isSubmitting = false;
        this.resetRoleForm();
        this.loadRolesAndPermissions();
      },
      error: (error) => {
        this.setStatus(error?.error?.message ?? 'Unable to delete role.', true);
        this.isSubmitting = false;
      },
    });
  }

  private setSectionFormState(): void {
    if (this.activeSection === 'users') this.resetUserForm();
    if (this.activeSection === 'roles') this.resetRoleForm();
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigateByUrl('/login');
  }

  saveMailSettings(): void {
    if (this.mailForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiService.saveMailSettings(this.mailForm.value).subscribe({
      next: () => {
        this.setStatus('Mail settings saved successfully.');
        this.isSubmitting = false;
      },
      error: () => {
        this.setStatus('Unable to save mail settings.', true);
        this.isSubmitting = false;
      },
    });
  }

  saveBlog(): void {
    if (this.blogForm.invalid || this.isSubmitting) {
      return;
    }

    const payload = this.blogForm.value;
    this.isSubmitting = true;

    const request = payload.id
      ? this.apiService.updateBlog(payload.id, payload)
      : this.apiService.createBlog(payload);

    request.subscribe({
      next: (created) => {
        this.setStatus(payload.id ? 'Blog updated.' : 'Blog created.');
        this.blogForm.reset({
          id: null,
          title: '',
          excerpt: '',
          slug: '',
          content: '',
        });
        this.blogs = [
          ...this.blogs.filter((item) => item.id !== created.id),
          created,
        ];
        this.isSubmitting = false;
      },
      error: () => {
        this.setStatus('Unable to save blog.', true);
        this.isSubmitting = false;
      },
    });
  }

  loadBlogForEdit(blog: BlogItem): void {
    this.blogForm.patchValue({ ...blog, id: blog.id ?? null });
  }

  deleteBlog(id: number): void {
    this.apiService.deleteBlog(id).subscribe({
      next: () => {
        this.blogs = this.blogs.filter((blog) => blog.id !== id);
        this.setStatus('Blog deleted.');
      },
      error: () => this.setStatus('Unable to delete blog.', true),
    });
  }

  saveCourse(): void {
    if (this.courseForm.invalid || this.isSubmitting) {
      return;
    }

    const payload = this.courseForm.value;
    this.isSubmitting = true;

    const request = payload.id
      ? this.apiService.updateCourse(payload.id, payload)
      : this.apiService.createCourse(payload);

    request.subscribe({
      next: (created) => {
        this.setStatus(payload.id ? 'Course updated.' : 'Course created.');
        this.courseForm.reset({
          id: null,
          name: '',
          description: '',
          price: '',
          slug: '',
        });
        this.courses = [
          ...this.courses.filter((item) => item.id !== created.id),
          created,
        ];
        this.isSubmitting = false;
      },
      error: () => {
        this.setStatus('Unable to save course.', true);
        this.isSubmitting = false;
      },
    });
  }

  loadCourseForEdit(course: CourseItem): void {
    this.courseForm.patchValue({ ...course, id: course.id ?? null });
  }

  deleteCourse(id: number): void {
    this.apiService.deleteCourse(id).subscribe({
      next: () => {
        this.courses = this.courses.filter((course) => course.id !== id);
        this.setStatus('Course deleted.');
      },
      error: () => this.setStatus('Unable to delete course.', true),
    });
  }

  saveLanguage(): void {
    if (this.languageForm.invalid || this.isSubmitting) {
      return;
    }

    const payload = this.languageForm.value;
    this.isSubmitting = true;

    const request = payload.id
      ? this.apiService.updateLanguage(payload.id, payload)
      : this.apiService.createLanguage(payload);

    request.subscribe({
      next: (created) => {
        this.setStatus(payload.id ? 'Language updated.' : 'Language created.');
        this.languageForm.reset({
          id: null,
          name: '',
          code: '',
          nativeName: '',
          isActive: true,
        });
        this.languages = [
          ...this.languages.filter((item) => item.id !== created.id),
          created,
        ];
        this.isSubmitting = false;
      },
      error: () => {
        this.setStatus('Unable to save language.', true);
        this.isSubmitting = false;
      },
    });
  }

  loadLanguageForEdit(language: LanguageItem): void {
    this.languageForm.patchValue({ ...language, id: language.id ?? null });
  }

  deleteLanguage(id: number): void {
    if (!window.confirm('Delete language and all its levels and exams?')) return;
    this.apiService.deleteLanguage(id).subscribe({
      next: () => {
        this.languages = this.languages.filter(
          (language) => language.id !== id,
        );
        this.expandedLanguageId = null;
        this.selectedLanguageForDetails = null;
        this.setStatus('Language deleted.');
      },
      error: () => this.setStatus('Unable to delete language.', true),
    });
  }

  expandLanguageDetails(languageId: number): void {
    if (this.expandedLanguageId === languageId) {
      this.expandedLanguageId = null;
      this.selectedLanguageForDetails = null;
      this.languageLevels = [];
      this.examSessions = [];
      return;
    }

    this.expandedLanguageId = languageId;
    this.selectedLanguageForDetails =
      this.languages.find((l) => l.id === languageId) ?? null;
    this.loadLanguageLevels(languageId);
  }

  private loadLanguageLevels(languageId: number): void {
    this.apiService.getLanguageLevels(languageId).subscribe({
      next: (levels) => {
        this.languageLevels = levels;
        if (levels.length > 0 && levels[0].id) {
          this.loadExamSessions(languageId, levels[0].id);
        }
      },
      error: () => this.setStatus('Unable to load language levels.', true),
    });
  }

  private loadExamSessions(languageId: number, levelId: number): void {
    this.apiService.getExamSessions(languageId, levelId).subscribe({
      next: (exams) => {
        this.examSessions = exams;
      },
      error: () => this.setStatus('Unable to load exam sessions.', true),
    });
  }

  resetLanguageForm(): void {
    this.languageForm.reset({
      id: null,
      name: '',
      code: '',
      nativeName: '',
      isActive: true,
    });
    this.expandedLanguageId = null;
    this.selectedLanguageForDetails = null;
  }

  resetLevelForm(): void {
    this.levelForm.reset({
      id: null,
      cefrLevel: '',
      courseHours: '',
      price: '',
    });
  }

  resetExamForm(): void {
    this.examForm.reset({
      id: null,
      languageLevelId: '',
      examDate: '',
      registrationStartDate: '',
      registrationDeadline: '',
      subscriptionUrl: '',
      maxParticipants: null,
    });
  }

  loadLevelForEdit(level: any): void {
    this.levelForm.patchValue({
      id: level.id,
      cefrLevel: level.cefrLevel,
      courseHours: level.courseHours,
      price: level.price,
    });
  }

  saveLanguageLevel(): void {
    if (this.levelForm.invalid || this.isSubmitting || !this.expandedLanguageId)
      return;

    const { id, courseHours, price, ...rest } = this.levelForm.value;
    const formValue = {
      ...rest,
      courseHours: courseHours == null ? undefined : String(courseHours),
      price: price == null ? undefined : String(price),
    };
    this.isSubmitting = true;

    const request = id
      ? this.apiService.updateLanguageLevel(
          this.expandedLanguageId,
          id,
          formValue,
        )
      : this.apiService.createLanguageLevel(this.expandedLanguageId, formValue);

    request.subscribe({
      next: () => {
        this.setStatus(id ? 'Level updated.' : 'Level added.');
        this.isSubmitting = false;
        this.resetLevelForm();
        this.loadLanguageLevels(this.expandedLanguageId!);
      },
      error: (error) => {
        this.setStatus(
          error?.error?.message ?? 'Unable to save language level.',
          true,
        );
        this.isSubmitting = false;
      },
    });
  }

  deleteLanguageLevel(levelId: number): void {
    if (!window.confirm('Delete this level and all its exams?')) return;
    if (!this.expandedLanguageId) return;

    this.apiService
      .deleteLanguageLevel(this.expandedLanguageId, levelId)
      .subscribe({
        next: () => {
          this.setStatus('Level deleted.');
          this.loadLanguageLevels(this.expandedLanguageId!);
        },
        error: () => this.setStatus('Unable to delete language level.', true),
      });
  }

  loadExamForEdit(exam: any): void {
    this.examForm.patchValue({
      id: exam.id,
      languageLevelId: exam.languageLevelId,
      examDate: this.formatDateTimeLocal(exam.examDate),
      registrationStartDate: this.formatDateTimeLocal(
        exam.registrationStartDate,
      ),
      registrationDeadline: this.formatDateTimeLocal(
        exam.registrationDeadline,
      ),
      subscriptionUrl: exam.subscriptionUrl,
      maxParticipants: exam.maxParticipants ?? null,
    });
  }

  private formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  saveExamSession(): void {
    if (this.examForm.invalid || this.isSubmitting || !this.expandedLanguageId)
      return;

    const { id, languageLevelId, subscriptionUrl, maxParticipants, ...rest } =
      this.examForm.value;
    const formValue = {
      ...rest,
      subscriptionUrl: subscriptionUrl || undefined,
      maxParticipants:
        maxParticipants === null || maxParticipants === ''
          ? undefined
          : Number(maxParticipants),
    };
    this.isSubmitting = true;

    const request = id
      ? this.apiService.updateExamSession(
          this.expandedLanguageId,
          languageLevelId,
          id,
          formValue,
        )
      : this.apiService.createExamSession(
          this.expandedLanguageId,
          languageLevelId,
          formValue,
        );

    request.subscribe({
      next: () => {
        this.setStatus(id ? 'Exam updated.' : 'Exam added.');
        this.isSubmitting = false;
        this.resetExamForm();
        this.loadExamSessions(this.expandedLanguageId!, languageLevelId);
      },
      error: (error) => {
        this.setStatus(
          error?.error?.message ?? 'Unable to save exam session.',
          true,
        );
        this.isSubmitting = false;
      },
    });
  }

  deleteExamSession(examId: number): void {
    if (!window.confirm('Delete this exam session?')) return;
    if (!this.expandedLanguageId || !this.languageLevels.length) return;

    const levelId = this.languageLevels[0].id;
    this.apiService
      .deleteExamSession(this.expandedLanguageId, levelId, examId)
      .subscribe({
        next: () => {
          this.setStatus('Exam deleted.');
          this.loadExamSessions(this.expandedLanguageId!, levelId);
        },
        error: () => this.setStatus('Unable to delete exam session.', true),
      });
  }

  saveMedia(): void {
    if (this.mediaForm.invalid || this.isSubmitting) {
      return;
    }

    const payload = this.mediaForm.value;
    this.isSubmitting = true;

    const request = payload.id
      ? this.apiService.updateMedia(payload.id, payload)
      : this.apiService.createMedia(payload);

    request.subscribe({
      next: (created) => {
        this.setStatus(
          payload.id ? 'Slider image updated.' : 'Slider image added.',
        );
        this.mediaForm.reset({
          id: null,
          title: '',
          imageUrl: '',
          altText: '',
          isActive: true,
        });
        this.media = [
          ...this.media.filter((item) => item.id !== created.id),
          created,
        ];
        this.isSubmitting = false;
      },
      error: () => {
        this.setStatus('Unable to save slider image.', true);
        this.isSubmitting = false;
      },
    });
  }

  loadMediaForEdit(item: MediaItem): void {
    this.mediaForm.patchValue({ ...item, id: item.id ?? null });
  }

  deleteMedia(id: number): void {
    this.apiService.deleteMedia(id).subscribe({
      next: () => {
        this.media = this.media.filter((item) => item.id !== id);
        this.setStatus('Slider image deleted.');
      },
      error: () => this.setStatus('Unable to delete slider image.', true),
    });
  }

  updateCourseRequestStatus(
    id: number,
    status: CourseRequestItem['status'],
  ): void {
    if (!status) {
      return;
    }

    this.apiService.updateCourseRequestStatus(id, status).subscribe({
      next: (updated) => {
        this.courseRequests = this.courseRequests.map((request) =>
          request.id === id ? { ...request, status: updated.status } : request,
        );
        this.setStatus('Course request status updated.');
      },
      error: () => this.setStatus('Unable to update course request.', true),
    });
  }

  deleteCourseRequest(id: number): void {
    this.apiService.deleteCourseRequest(id).subscribe({
      next: () => {
        this.courseRequests = this.courseRequests.filter(
          (request) => request.id !== id,
        );
        this.setStatus('Course request deleted.');
      },
      error: () => this.setStatus('Unable to delete course request.', true),
    });
  }

  filterRegistrations(event: Event): void {
    this.registrationFilter = (event.target as HTMLSelectElement).value;
    this.isLoading = true;
    this.loadSection();
  }

  setRegistrationStatus(
    registration: ExamRegistrationItem,
    status: ExamRegistrationItem['status'],
  ): void {
    this.apiService
      .updateExamRegistrationStatus(registration.id, status)
      .subscribe({
        next: () => {
          this.setStatus('Registration ' + status + '.');
          this.loadSection();
        },
        error: (error) =>
          this.setStatus(
            error?.error?.message ?? 'Unable to update registration.',
            true,
          ),
      });
  }

  deleteRegistration(registration: ExamRegistrationItem): void {
    if (!window.confirm('Delete this registration?')) return;
    this.apiService.deleteExamRegistration(registration.id).subscribe({
      next: () => {
        this.examRegistrations = this.examRegistrations.filter(
          (item) => item.id !== registration.id,
        );
        this.setStatus('Registration deleted.');
      },
      error: () => this.setStatus('Unable to delete registration.', true),
    });
  }
}
