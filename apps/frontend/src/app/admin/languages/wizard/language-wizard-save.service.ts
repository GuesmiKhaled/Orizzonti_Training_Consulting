import { Injectable, inject } from '@angular/core';
import { Observable, concat, defer, ignoreElements, map, tap } from 'rxjs';
import { LanguageItem } from '../../../services/orizzonti-api.service';
import {
  ExamSessionsService,
  LanguageLevelsService,
  LanguagesService,
} from '../../../core/api/entities/language.services';
import { API_BASE_URL } from '../../../core/api/api.config';
import { HttpClient } from '@angular/common/http';
import { LanguageWizardStore } from './language-wizard.store';
import { examCreatePayload, levelCreatePayload } from './language-wizard.mapper';

/**
 * Create: one transactional request. Edit: only the changed entities, in
 * dependency order. Each success is recorded in the store, so after a failure
 * the user can retry and only the remaining changes are sent.
 */
@Injectable({ providedIn: 'root' })
export class LanguageWizardSaveService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly languages = inject(LanguagesService);
  private readonly levels = inject(LanguageLevelsService);
  private readonly exams = inject(ExamSessionsService);

  create(store: LanguageWizardStore): Observable<LanguageItem> {
    return this.http.post<LanguageItem>(
      `${this.baseUrl}/languages/wizard`,
      store.createPayload(),
    );
  }

  saveEdit(store: LanguageWizardStore): Observable<void> {
    const languageId = store.languageId();
    if (languageId === null) {
      throw new Error('saveEdit requires an existing language');
    }
    const steps: Observable<unknown>[] = [];

    const languagePatch = store.languagePatchPayload();
    if (languagePatch) {
      steps.push(
        this.languages
          .update(languageId, languagePatch)
          .pipe(tap(() => store.markLanguageSaved())),
      );
    }

    for (const entry of store.levels()) {
      if (!entry.baseline) {
        steps.push(
          this.levels
            .create(levelCreatePayload(entry.form.getRawValue()), [languageId])
            .pipe(tap((created) => store.markLevelSaved(entry.key, created.id as number))),
        );
        continue;
      }
      const patch = store.levelPatchPayload(entry);
      if (patch && entry.id !== null) {
        steps.push(
          this.levels
            .update(entry.id, patch, [languageId])
            .pipe(tap(() => store.markLevelSaved(entry.key, entry.id as number))),
        );
      }
    }

    for (const entry of store.exams()) {
      steps.push(
        defer(() => {
          const levelId = store.levelIdFor(entry.levelKey);
          if (levelId === null) {
            throw new Error('The exam level has not been saved yet');
          }
          if (!entry.baseline) {
            return this.exams
              .create(examCreatePayload(entry.form.getRawValue()), [languageId, levelId])
              .pipe(tap((created) => store.markExamSaved(entry.key, created.id as number)));
          }
          const patch = store.examPatchPayload(entry);
          if (!patch || entry.id === null) {
            return [];
          }
          return this.exams
            .update(entry.id, patch, [languageId, levelId])
            .pipe(tap(() => store.markExamSaved(entry.key, entry.id as number)));
        }),
      );
    }

    return concat(...steps).pipe(
      ignoreElements(),
      map(() => undefined),
    );
  }
}
