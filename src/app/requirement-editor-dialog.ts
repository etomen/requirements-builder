import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  RequirementAuditEntry,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  User,
} from './requirements.models';

export interface RequirementForm {
  title: string;
  description: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  type: RequirementType;
  ownerId: string;
  tags: string;
  acceptanceCriteria: string;
  points: number | null;
  hours: number | null;
}

export interface RequirementEditorDialogData {
  form: RequirementForm;
  editing: boolean;
  statuses: readonly RequirementStatus[];
  priorities: readonly RequirementPriority[];
  types: readonly RequirementType[];
  users: User[];
  auditEntries: RequirementAuditEntry[];
}

@Component({
  selector: 'app-requirement-editor-dialog',
  imports: [CdkDrag, CdkDragHandle, FormsModule, MatDialogModule],
  templateUrl: './requirement-editor-dialog.html',
  styleUrl: './requirement-editor-dialog.scss',
})
export class RequirementEditorDialog {
  protected readonly data = inject<RequirementEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RequirementEditorDialog, boolean>);

  protected close(): void {
    this.dialogRef.close(false);
  }

  protected submit(): void {
    this.dialogRef.close(true);
  }
}