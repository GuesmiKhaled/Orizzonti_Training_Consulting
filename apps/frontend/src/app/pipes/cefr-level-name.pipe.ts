import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cefrLevelName',
  standalone: true,
})
export class CefrLevelNamePipe implements PipeTransform {
  private readonly names: { [key: string]: string } = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced',
    C2: 'Mastery',
  };

  transform(level: string): string {
    return this.names[level] || level;
  }
}
