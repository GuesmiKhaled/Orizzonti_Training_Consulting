import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BlogItem,
  CourseItem,
  CourseRequestItem,
  MediaItem,
} from '../../../services/orizzonti-api.service';
import { CrudService } from '../crud.service';

@Injectable({ providedIn: 'root' })
export class BlogsService extends CrudService<BlogItem> {
  protected path(): string {
    return 'blogs';
  }

  /** All posts including drafts. The public GET /blogs only returns published ones. */
  override list(): Observable<BlogItem[]> {
    return this.http.get<BlogItem[]>(`${this.baseUrl}/blogs/manage`);
  }

  /** A post for editing, drafts included. */
  override get(id: number): Observable<BlogItem> {
    return this.http.get<BlogItem>(`${this.baseUrl}/blogs/manage/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CoursesService extends CrudService<CourseItem> {
  protected path(): string {
    return 'courses';
  }

  featured(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.collectionUrl([])}/featured`);
  }
}

@Injectable({ providedIn: 'root' })
export class MediaService extends CrudService<MediaItem> {
  protected path(): string {
    return 'media';
  }
}

/** The API supports list, update and remove; creation is public via the contact flow. */
@Injectable({ providedIn: 'root' })
export class CourseRequestsService extends CrudService<CourseRequestItem> {
  protected path(): string {
    return 'course-requests';
  }
}
