import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PermissionItem { key: string; name: string; group: string; }
export interface AppRole {
  id?: number;
  name: string;
  description?: string;
  system?: boolean;
  permissions: string[];
  baseRole?: string; // ADMIN/PROJECT_MANAGER/USER for built-in roles; absent for custom roles
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private base = '/roles';

  constructor(private api: ApiService) {}

  catalog(): Observable<PermissionItem[]> {
    return this.api.get<PermissionItem[]>(`${this.base}/permissions`);
  }
  list(): Observable<AppRole[]> {
    return this.api.get<AppRole[]>(this.base);
  }
  create(role: AppRole): Observable<any> {
    return this.api.post<any>(this.base, role);
  }
  update(id: number, role: AppRole): Observable<any> {
    return this.api.put<any>(`${this.base}/${id}`, role);
  }
  delete(id: number): Observable<any> {
    return this.api.delete<any>(`${this.base}/${id}`);
  }
  assign(roleId: number, userId: number): Observable<any> {
    return this.api.post<any>(`${this.base}/${roleId}/assign/${userId}`, {});
  }
  unassign(userId: number): Observable<any> {
    return this.api.delete<any>(`${this.base}/assign/${userId}`);
  }
}
