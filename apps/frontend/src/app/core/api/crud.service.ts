import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface DeleteResult {
  deleted: boolean;
  id: number;
}

export type ParentIds = readonly number[];

/**
 * Generic REST client. Nested resources (e.g. languages/:id/levels) receive
 * their parent ids through `parents`; flat resources ignore it.
 * Updates use PATCH. Authentication headers come from `authInterceptor`.
 */
export abstract class CrudService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = inject(API_BASE_URL);

  protected abstract path(parents: ParentIds): string;

  list(parents: ParentIds = []): Observable<T[]> {
    return this.http.get<T[]>(this.collectionUrl(parents));
  }

  get(id: number, parents: ParentIds = []): Observable<T> {
    return this.http.get<T>(this.itemUrl(id, parents));
  }

  create(dto: CreateDto, parents: ParentIds = []): Observable<T> {
    return this.http.post<T>(this.collectionUrl(parents), dto);
  }

  update(id: number, dto: UpdateDto, parents: ParentIds = []): Observable<T> {
    return this.http.patch<T>(this.itemUrl(id, parents), dto);
  }

  remove(id: number, parents: ParentIds = []): Observable<DeleteResult> {
    return this.http.delete<DeleteResult>(this.itemUrl(id, parents));
  }

  protected collectionUrl(parents: ParentIds): string {
    return `${this.baseUrl}/${this.path(parents)}`;
  }

  protected itemUrl(id: number, parents: ParentIds): string {
    return `${this.collectionUrl(parents)}/${id}`;
  }
}
