import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private basePath = '/files';

  constructor(private apiService: ApiService, private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    // We might need to bypass ApiService for file uploads to not set Content-Type to application/json
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.post<any>(`${environment.apiUrl}${this.basePath}/upload`, formData, { headers });
  }

  deleteFile(fileUrl: string): Observable<void> {
    // We send the fileUrl to delete it from the server
    return this.apiService.delete<void>(`${this.basePath}?fileUrl=${encodeURIComponent(fileUrl)}`);
  }

  /** Server origin without the trailing /api (uploads are served from the web root). */
  private origin(): string {
    return environment.apiUrl.replace(/\/api\/?$/, '');
  }

  /**
   * Fetch an uploaded file as a Blob with the JWT attached (the /uploads/** path is
   * authenticated, so a plain anchor href would 401) and trigger a browser download.
   * Returns the Observable so callers can surface success/error feedback.
   */
  downloadFile(fileUrl: string, fileName?: string): Observable<Blob> {
    const url = fileUrl.startsWith('http') ? fileUrl : `${this.origin()}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      tap(blob => this.saveBlob(blob, fileName || fileUrl.split('/').pop() || 'download'))
    );
  }

  /** Fetch an uploaded file (auth-protected) as a Blob — caller decides what to do (in-app preview, etc.). */
  fetchBlob(fileUrl: string): Observable<Blob> {
    const url = fileUrl.startsWith('http') ? fileUrl : `${this.origin()}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return this.http.get(url, { headers, responseType: 'blob' });
  }

  /** Fetch an uploaded file (auth-protected) and open it in a new browser tab for preview. */
  previewFile(fileUrl: string): Observable<Blob> {
    const url = fileUrl.startsWith('http') ? fileUrl : `${this.origin()}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      tap(blob => {
        const objUrl = window.URL.createObjectURL(blob);
        window.open(objUrl, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(objUrl), 60000);
      })
    );
  }

  private saveBlob(blob: Blob, name: string): void {
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(objUrl), 1000);
  }
}
