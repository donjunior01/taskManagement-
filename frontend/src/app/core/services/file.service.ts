import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
}
