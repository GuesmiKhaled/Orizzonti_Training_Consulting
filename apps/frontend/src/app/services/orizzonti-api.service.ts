import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '../core/http/http-context.tokens';

declare global {
  interface Window {
    __ORIZZONTI_CONFIG__?: { apiBaseUrl?: string };
  }
}

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  isActive?: boolean;
  roleId?: number | null;
  role?: string;
  permissions?: string[];
}

export interface AdminRole {
  id: number;
  name: string;
  description?: string;
  permissions: AdminPermission[];
}

export interface AdminPermission {
  id: number;
  name: string;
  description?: string;
}

export interface AdminUserPage {
  items: AuthUser[];
  total: number;
  page: number;
  size: number;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface BlogItem {
  id?: number;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  imageUrl?: string;
  isPublished?: boolean;
  createdAt?: string;
}

export interface CourseItem {
  id?: number;
  name: string;
  description?: string;
  level?: string;
  price?: string;
  slug?: string;
  imageUrl?: string;
}

export interface LanguageItem {
  id?: number;
  name: string;
  code?: string;
  nativeName?: string;
  isActive?: boolean;
  levels?: LanguageLevel[];
}

export interface LanguageLevel {
  id?: number;
  languageId?: number;
  cefrLevel: string;
  price?: string;
  courseHours?: string;
  isActive?: boolean;
  examSessions?: ExamSession[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamSession {
  id?: number;
  languageLevelId?: number;
  examDate: string;
  location?: string;
  registrationStartDate: string;
  registrationDeadline: string;
  price?: string;
  courseHours?: string;
  subscriptionUrl?: string;
  isActive?: boolean;
  maxParticipants?: number | null;
  placesLeft?: number | null;
  isBookable?: boolean;
  bookingStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamRegistrationRequest {
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface ExamRegistrationItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  examSessionId: number;
  examDate?: string;
  location?: string;
  cefrLevel?: string;
  languageName?: string;
}

export interface MediaItem {
  id?: number;
  title: string;
  imageUrl: string;
  altText?: string;
  isActive?: boolean;
}

export interface MailSettings {
  id?: number;
  host: string;
  port: number;
  username: string;
  password?: string;
  passwordConfigured?: boolean;
  fromAddress: string;
  secure: boolean;
}

export interface DashboardStats {
  blogsCount: number;
  coursesCount: number;
  languagesCount: number;
  sliderCount: number;
  courseRequestsCount: number;
  newCourseRequestsCount: number;
}

export interface CourseRequestItem {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  courseName: string;
  message?: string;
  status?: 'new' | 'reviewed' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OrizzontiApiService {
  private readonly baseUrl = (
    window.__ORIZZONTI_CONFIG__?.apiBaseUrl ?? 'http://localhost:5007'
  ).replace(/\/+$/, '');
  private readonly tokenKey = 'orizzonti-admin-token';
  private readonly profileKey = 'orizzonti-admin-profile';

  constructor(private readonly http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private inlineErrors(): HttpContext {
    return new HttpContext().set(SKIP_ERROR_TOAST, true);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.profileKey);
  }

  submitContact(payload: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.baseUrl}/contact`, payload, {
      context: this.inlineErrors(),
    });
  }

  loginAdmin(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, payload, {
        context: this.inlineErrors(),
      })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.accessToken);
          localStorage.setItem(this.profileKey, JSON.stringify(response.user));
        }),
      );
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAdminUsers(page = 0, size = 20, search = ''): Observable<AdminUserPage> {
    return this.http.get<AdminUserPage>(`${this.baseUrl}/auth/users`, {
      headers: this.getAuthHeaders(),
      params: { page, size, search },
    });
  }

  createAdminUser(payload: {
    username: string;
    password: string;
    roleId: number;
    isActive?: boolean;
  }): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/auth/users`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAdminUser(
    id: number,
    payload: Partial<{
      username: string;
      password: string;
      roleId: number;
      isActive: boolean;
    }>,
  ): Observable<AuthUser> {
    return this.http.patch<AuthUser>(
      `${this.baseUrl}/auth/users/${id}`,
      payload,
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  deleteAdminUser(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/auth/users/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getAdminRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.baseUrl}/auth/roles`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAdminPermissions(): Observable<AdminPermission[]> {
    return this.http.get<AdminPermission[]>(
      `${this.baseUrl}/auth/permissions`,
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  createAdminRole(payload: {
    name: string;
    description?: string;
    permissionIds: number[];
  }): Observable<AdminRole> {
    return this.http.post<AdminRole>(`${this.baseUrl}/auth/roles`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAdminRole(
    id: number,
    payload: Partial<{
      name: string;
      description: string;
      permissionIds: number[];
    }>,
  ): Observable<AdminRole> {
    return this.http.patch<AdminRole>(
      `${this.baseUrl}/auth/roles/${id}`,
      payload,
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  deleteAdminRole(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/auth/roles/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBlogs(): Observable<BlogItem[]> {
    return this.http.get<BlogItem[]>(`${this.baseUrl}/blogs`);
  }

  createBlog(payload: Partial<BlogItem>): Observable<BlogItem> {
    return this.http.post<BlogItem>(`${this.baseUrl}/blogs`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateBlog(id: number, payload: Partial<BlogItem>): Observable<BlogItem> {
    return this.http.patch<BlogItem>(`${this.baseUrl}/blogs/${id}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteBlog(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/blogs/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/courses`);
  }

  getFeaturedCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/courses/featured`);
  }

  createCourse(payload: Partial<CourseItem>): Observable<CourseItem> {
    return this.http.post<CourseItem>(`${this.baseUrl}/courses`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateCourse(
    id: number,
    payload: Partial<CourseItem>,
  ): Observable<CourseItem> {
    return this.http.patch<CourseItem>(
      `${this.baseUrl}/courses/${id}`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteCourse(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/courses/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getLanguages(): Observable<LanguageItem[]> {
    return this.http.get<LanguageItem[]>(`${this.baseUrl}/languages`);
  }

  createLanguage(payload: Partial<LanguageItem>): Observable<LanguageItem> {
    return this.http.post<LanguageItem>(`${this.baseUrl}/languages`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateLanguage(
    id: number,
    payload: Partial<LanguageItem>,
  ): Observable<LanguageItem> {
    return this.http.patch<LanguageItem>(
      `${this.baseUrl}/languages/${id}`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteLanguage(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/languages/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  // Language Levels
  getLanguageLevels(languageId: number): Observable<LanguageLevel[]> {
    return this.http.get<LanguageLevel[]>(
      `${this.baseUrl}/languages/${languageId}/levels`,
    );
  }

  getLanguageLevel(
    languageId: number,
    levelId: number,
  ): Observable<LanguageLevel> {
    return this.http.get<LanguageLevel>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}`,
    );
  }

  createLanguageLevel(
    languageId: number,
    payload: Partial<LanguageLevel>,
  ): Observable<LanguageLevel> {
    
    return this.http.post<LanguageLevel>(
      `${this.baseUrl}/languages/${languageId}/levels`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  updateLanguageLevel(
    languageId: number,
    levelId: number,
    payload: Partial<LanguageLevel>,
  ): Observable<LanguageLevel> {
    return this.http.patch<LanguageLevel>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteLanguageLevel(
    languageId: number,
    levelId: number,
  ): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  // Exam Sessions
  getExamSessions(languageId: number, levelId: number): Observable<ExamSession[]> {
    return this.http.get<ExamSession[]>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams`,
    );
  }

  getExamSession(
    languageId: number,
    levelId: number,
    sessionId: number,
  ): Observable<ExamSession> {
    return this.http.get<ExamSession>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams/${sessionId}`,
    );
  }

  createExamSession(
    languageId: number,
    levelId: number,
    payload: Partial<ExamSession>,
  ): Observable<ExamSession> {
    return this.http.post<ExamSession>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  updateExamSession(
    languageId: number,
    levelId: number,
    sessionId: number,
    payload: Partial<ExamSession>,
  ): Observable<ExamSession> {
    return this.http.patch<ExamSession>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams/${sessionId}`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteExamSession(
    languageId: number,
    levelId: number,
    sessionId: number,
  ): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams/${sessionId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  checkBookingEligibility(
    languageId: number,
    levelId: number,
    sessionId: number,
  ): Observable<{ isBookable: boolean; status: string; bookingUrl?: string }> {
    return this.http.post<{
      isBookable: boolean;
      status: string;
      bookingUrl?: string;
    }>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams/${sessionId}/subscribe`,
      {},
    );
  }

  registerForExam(
    languageId: number,
    levelId: number,
    sessionId: number,
    payload: ExamRegistrationRequest,
  ): Observable<{ id: number; status: string; message: string }> {
    return this.http.post<{ id: number; status: string; message: string }>(
      `${this.baseUrl}/languages/${languageId}/levels/${levelId}/exams/${sessionId}/register`,
      payload,
      { context: this.inlineErrors() },
    );
  }

  getExamRegistrations(status = ''): Observable<ExamRegistrationItem[]> {
    return this.http.get<ExamRegistrationItem[]>(
      `${this.baseUrl}/exam-registrations`,
      { headers: this.getAuthHeaders(), params: status ? { status } : {} },
    );
  }

  updateExamRegistrationStatus(
    id: number,
    status: ExamRegistrationItem['status'],
  ): Observable<ExamRegistrationItem> {
    return this.http.patch<ExamRegistrationItem>(
      `${this.baseUrl}/exam-registrations/${id}`,
      { status },
      { headers: this.getAuthHeaders() },
    );
  }

  deleteExamRegistration(
    id: number,
  ): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/exam-registrations/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getMedia(): Observable<MediaItem[]> {
    return this.http.get<MediaItem[]>(`${this.baseUrl}/media`);
  }

  createMedia(payload: Partial<MediaItem>): Observable<MediaItem> {
    return this.http.post<MediaItem>(`${this.baseUrl}/media`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateMedia(id: number, payload: Partial<MediaItem>): Observable<MediaItem> {
    return this.http.patch<MediaItem>(`${this.baseUrl}/media/${id}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteMedia(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/media/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }

  getMailSettings(): Observable<MailSettings> {
    return this.http.get<MailSettings>(`${this.baseUrl}/settings/mail`, {
      headers: this.getAuthHeaders(),
    });
  }

  saveMailSettings(payload: Partial<MailSettings>): Observable<MailSettings> {
    return this.http.patch<MailSettings>(
      `${this.baseUrl}/settings/mail`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  getCourseRequests(): Observable<CourseRequestItem[]> {
    return this.http.get<CourseRequestItem[]>(
      `${this.baseUrl}/course-requests`,
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  updateCourseRequestStatus(
    id: number,
    status: CourseRequestItem['status'],
  ): Observable<CourseRequestItem> {
    return this.http.patch<CourseRequestItem>(
      `${this.baseUrl}/course-requests/${id}`,
      { status },
      { headers: this.getAuthHeaders() },
    );
  }

  deleteCourseRequest(
    id: number,
  ): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.baseUrl}/course-requests/${id}`,
      { headers: this.getAuthHeaders() },
    );
  }
}
