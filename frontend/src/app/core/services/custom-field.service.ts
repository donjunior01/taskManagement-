import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX';

export interface CustomFieldDefinition {
  id?: number;
  name: string;
  fieldType: CustomFieldType;
  options?: string | null;
  required: boolean;
  displayOrder: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomFieldService {
  private base = '/custom-fields';
  constructor(private api: ApiService) {}

  /** Active fields, for rendering on task forms. */
  listActive(): Observable<CustomFieldDefinition[]> { return this.api.get<CustomFieldDefinition[]>(this.base); }
  /** All fields including disabled, for the management page. */
  listAll(): Observable<CustomFieldDefinition[]> { return this.api.get<CustomFieldDefinition[]>(`${this.base}/all`); }
  create(f: CustomFieldDefinition): Observable<any> { return this.api.post<any>(this.base, f); }
  update(id: number, f: CustomFieldDefinition): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, f); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }

  /** SELECT options string ("A,B,C") → array. */
  optionList(f: CustomFieldDefinition): string[] {
    return (f.options || '').split(',').map(o => o.trim()).filter(o => !!o);
  }
}
