import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RequirementsApiService } from './requirements-api.service';
import { RequirementEditorDialog, RequirementForm } from './requirement-editor-dialog';
import {
  ApplicationProfile,
  CreateRequirementRequest,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  Requirement,
  RequirementAuditEntry,
  RequirementPriority,
  RequirementSearchQuery,
  RequirementStatus,
  RequirementType,
  User,
} from './requirements.models';

@Component({
  selector: 'app-root',
  imports: [FormsModule, MatDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly api = inject(RequirementsApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dialog = inject(MatDialog);

  protected readonly statuses = REQUIREMENT_STATUSES;
  protected readonly priorities = REQUIREMENT_PRIORITIES;
  protected readonly types = REQUIREMENT_TYPES;

  protected readonly applications = signal<ApplicationProfile[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly requirements = signal<Requirement[]>([]);
  protected readonly auditEntries = signal<RequirementAuditEntry[]>([]);
  protected readonly selectedRequirement = signal<Requirement | null>(null);
  protected readonly editingRequirementId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly total = signal(0);

  protected filters: RequirementSearchQuery = {
    q: '',
    status: '',
    priority: '',
    tag: '',
    page: 1,
    pageSize: 25,
  };

  protected form: RequirementForm = this.emptyForm();

  protected readonly activeApplication = computed(() => this.applications()[0] ?? null);
  protected readonly visibleCount = computed(() => this.requirements().length);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadReferenceData();
  }

  protected loadReferenceData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.listApplications().subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.filters.applicationId = applications[0]?.id;
        this.loadUsers();
        this.searchRequirements();
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load application profiles.');
      },
    });
  }

  protected loadUsers(): void {
    this.api.listUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.errorMessage.set('Unable to load users.'),
    });
  }

  protected searchRequirements(resetPage = false): void {
    if (resetPage) {
      this.filters.page = 1;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.api.searchRequirements(this.filters).subscribe({
      next: (response) => {
        this.requirements.set(response.items);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to search requirements.');
      },
    });
  }

  protected saveRequirement(): void {
    const applicationId = this.filters.applicationId ?? this.activeApplication()?.id;
    const payload = this.buildPayload(applicationId);

    if (!payload) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const editingId = this.editingRequirementId();
    const request = editingId
      ? this.api.updateRequirement(editingId, payload)
      : this.api.createRequirement(payload as CreateRequirementRequest);

    request.subscribe({
      next: (requirement) => {
        this.saving.set(false);
        this.editingRequirementId.set(requirement.id);
        this.selectedRequirement.set(requirement);
        this.setForm(requirement);
        this.loadAudit(requirement.id);
        this.searchRequirements();
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.error ?? 'Unable to save requirement.');
      },
    });
  }

  protected editRequirement(requirement: Requirement): void {
    this.editingRequirementId.set(requirement.id);
    this.selectedRequirement.set(requirement);
    this.setForm(requirement);
    this.loadAudit(requirement.id);
    this.openRequirementEditor();
  }

  protected newRequirement(): void {
    this.editingRequirementId.set(null);
    this.selectedRequirement.set(null);
    this.auditEntries.set([]);
    this.form = this.emptyForm();
    this.openRequirementEditor();
  }

  private setForm(requirement: Requirement): void {
    this.form = {
      title: requirement.title,
      description: requirement.description ?? '',
      status: requirement.status,
      priority: requirement.priority ?? 'med',
      type: requirement.type ?? 'feature',
      ownerId: requirement.ownerId ?? '',
      tags: requirement.tags.join(', '),
      acceptanceCriteria: requirement.acceptanceCriteria.join('\n'),
      points: requirement.estimate?.points ?? null,
      hours: requirement.estimate?.hours ?? null,
    };
  }

  private openRequirementEditor(): void {
    const dialogRef = this.dialog.open(RequirementEditorDialog, {
      data: {
        form: this.form,
        editing: !!this.editingRequirementId(),
        statuses: this.statuses,
        priorities: this.priorities,
        types: this.types,
        users: this.users(),
        auditEntries: this.auditEntries(),
      },
      width: 'min(760px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '90vh',
      panelClass: 'requirement-editor-dialog',
    });

    dialogRef.afterClosed().subscribe((submitted) => {
      if (submitted) {
        this.saveRequirement();
      }
    });
  }

  protected archiveRequirement(requirement: Requirement): void {
    this.api.updateRequirement(requirement.id, { status: 'archived' }).subscribe({
      next: () => this.searchRequirements(),
      error: () => this.errorMessage.set('Unable to archive requirement.'),
    });
  }

  protected deleteRequirement(requirement: Requirement): void {
    this.api.deleteRequirement(requirement.id).subscribe({
      next: () => {
        if (this.editingRequirementId() === requirement.id) {
          this.newRequirement();
        }
        this.searchRequirements();
      },
      error: () => this.errorMessage.set('Unable to delete requirement.'),
    });
  }

  protected loadAudit(requirementId: string): void {
    this.api.listAudit(requirementId).subscribe({
      next: (entries) => this.auditEntries.set(entries),
      error: () => this.auditEntries.set([]),
    });
  }

  protected userName(id?: string): string {
    return this.users().find((user) => user.id === id)?.name ?? 'Unassigned';
  }

  protected applicationName(id: string): string {
    return this.applications().find((application) => application.id === id)?.name ?? 'Unknown';
  }

  private emptyForm(): RequirementForm {
    return {
      title: '',
      description: '',
      status: 'draft',
      priority: 'med',
      type: 'feature',
      ownerId: '',
      tags: '',
      acceptanceCriteria: '',
      points: null,
      hours: null,
    };
  }

  private buildPayload(applicationId?: string): CreateRequirementRequest | null {
    if (!applicationId) {
      this.errorMessage.set('Choose an application before saving.');
      return null;
    }

    const title = this.form.title.trim();
    if (!title) {
      this.errorMessage.set('Title is required.');
      return null;
    }

    const tags = this.form.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const acceptanceCriteria = this.form.acceptanceCriteria
      .split('\n')
      .map((criterion) => criterion.trim())
      .filter(Boolean);

    return {
      applicationId,
      title,
      description: this.form.description.trim(),
      status: this.form.status,
      priority: this.form.priority,
      type: this.form.type,
      ownerId: this.form.ownerId || undefined,
      tags,
      acceptanceCriteria,
      estimate: {
        points: this.form.points ?? undefined,
        hours: this.form.hours ?? undefined,
      },
    };
  }
}
