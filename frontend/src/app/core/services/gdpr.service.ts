import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class GdprService {
  constructor(private api: ApiService) {}

  /** Fetch the current user's personal data and save it as a JSON file (GDPR right of access). */
  exportMyData(): Observable<any> {
    return this.api.get<any>('/gdpr/export');
  }

  /** Trigger a client-side download of the exported data. */
  download(data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-data-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Admin: anonymise a user's PII and deactivate the account (GDPR erasure). */
  eraseUser(userId: number): Observable<any> {
    return this.api.post<any>(`/gdpr/erase/${userId}`, {});
  }
}
