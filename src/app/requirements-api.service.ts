import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  ApplicationProfile,
  CreateRequirementRequest,
  Requirement,
  RequirementAuditEntry,
  RequirementSearchQuery,
  RequirementSearchResponse,
  Tag,
  UpdateRequirementRequest,
  User,
} from './requirements.models';

@Injectable({ providedIn: 'root' })
export class RequirementsApiService {
  private readonly http = inject(HttpClient);

  listApplications() {
    return this.http.get<ApplicationProfile[]>('/api/applications');
  }

  listUsers() {
    return this.http.get<User[]>('/api/users');
  }

  listTags() {
    return this.http.get<Tag[]>('/api/tags');
  }

  searchRequirements(query: RequirementSearchQuery) {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<RequirementSearchResponse>('/api/requirements', { params });
  }

  createRequirement(payload: CreateRequirementRequest) {
    return this.http.post<Requirement>('/api/requirements', payload);
  }

  updateRequirement(id: string, payload: UpdateRequirementRequest) {
    return this.http.patch<Requirement>(`/api/requirements/${id}`, payload);
  }

  deleteRequirement(id: string) {
    return this.http.delete<Requirement>(`/api/requirements/${id}`);
  }

  listAudit(requirementId: string) {
    return this.http.get<RequirementAuditEntry[]>(`/api/requirements/${requirementId}/audit`);
  }
}
