import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ExamRegistrationItem,
  ExamRegistrationRequest,
  ExamSession,
  LanguageItem,
  LanguageLevel,
} from '../../../services/orizzonti-api.service';
import { CrudService, ParentIds } from '../crud.service';

function parent(parents: ParentIds, index: number): number {
  const id = parents[index];
  if (id === undefined) {
    throw new Error('Missing parent id for nested resource');
  }
  return id;
}

@Injectable({ providedIn: 'root' })
export class LanguagesService extends CrudService<LanguageItem> {
  protected path(): string {
    return 'languages';
  }
}

/** Parents: [languageId] */
@Injectable({ providedIn: 'root' })
export class LanguageLevelsService extends CrudService<LanguageLevel> {
  protected path(parents: ParentIds): string {
    return `languages/${parent(parents, 0)}/levels`;
  }
}

/** Parents: [languageId, levelId] */
@Injectable({ providedIn: 'root' })
export class ExamSessionsService extends CrudService<ExamSession> {
  protected path(parents: ParentIds): string {
    return `languages/${parent(parents, 0)}/levels/${parent(parents, 1)}/exams`;
  }

  register(
    sessionId: number,
    parents: ParentIds,
    dto: ExamRegistrationRequest,
  ): Observable<{ id: number; status: string; message: string }> {
    return this.http.post<{ id: number; status: string; message: string }>(
      `${this.itemUrl(sessionId, parents)}/register`,
      dto,
    );
  }
}

/** The API supports list (optional status filter), update (status) and remove only. */
@Injectable({ providedIn: 'root' })
export class ExamRegistrationsService extends CrudService<
  ExamRegistrationItem,
  never,
  { status: ExamRegistrationItem['status'] }
> {
  protected path(): string {
    return 'exam-registrations';
  }

  listByStatus(status = ''): Observable<ExamRegistrationItem[]> {
    return this.http.get<ExamRegistrationItem[]>(this.collectionUrl([]), {
      params: status ? { status } : {},
    });
  }
}
