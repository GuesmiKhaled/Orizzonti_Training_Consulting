import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
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
  user: AuthUser;
}

export interface BlogItem {
  id?: number;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
  createdAt?: string;
}

export interface CourseItem {
  id?: number;
  name: string;
  description?: string;
  level?: string;
  price?: string;
  startDate?: string;
  slug?: string;
  imageUrl?: string | null;
}

export interface LanguageItem {
  imageUrl?: string | null;
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
  adminUsersCount?: number;
  requestsByCourse?: { name: string; count: number }[];
  latestRequests?: {
    id: number;
    applicant: string;
    courseName: string;
    status: string;
    createdAt: string;
  }[];
}

export interface SiteSettings {
  id?: number;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  aboutText: string | null;
  studentsCount: number | null;
  coursesCount: number | null;
  yearsOfExperience: number | null;
  nextSessionDate: string | null;
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

  constructor(private readonly http: HttpClient) {}

  private inlineErrors(): HttpContext {
    return new HttpContext().set(SKIP_ERROR_TOAST, true);
  }

  submitContact(payload: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.baseUrl}/contact`, payload, {
      context: this.inlineErrors(),
    });
  }

  loginAdmin(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, payload, {
        withCredentials: true,
        context: this.inlineErrors(),
      });
  }

  getBlogs(): Observable<BlogItem[]> {
    return this.http.get<BlogItem[]>(`${this.baseUrl}/blogs`);
  }

  getFeaturedCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/courses/featured`);
  }

  /** Active slider images for the home carousel, newest first. */
  getSliderMedia(): Observable<MediaItem[]> {
    return this.http.get<MediaItem[]>(`${this.baseUrl}/media`, {
      context: this.inlineErrors(),
    });
  }

  getLanguages(): Observable<LanguageItem[]> {
    return this.http.get<LanguageItem[]>(`${this.baseUrl}/languages`);
  }

  // Language Levels
  getLanguageLevels(languageId: number): Observable<LanguageLevel[]> {
    return this.http.get<LanguageLevel[]>(
      `${this.baseUrl}/languages/${languageId}/levels`,
    );
  }

  // Exam Sessions
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

}
