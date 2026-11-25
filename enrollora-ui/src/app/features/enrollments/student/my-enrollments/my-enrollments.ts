import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  EnrollmentResponse,
  CancellationResponse,
} from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedEnrollmentId = signal<number | null>(null);
  cancellationReason = signal('');
  cancellationError = signal('');
  cancellationSuccess = signal('');
  isSubmittingCancellation = signal(false);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCancellationRequests(): void {
    this.enrollmentService.getMyCancellationRequests(1, 100).subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Unable to load cancellation requests:', error);
      },
    });
  }

  requestForEnrollment(enrollmentId: number): CancellationResponse | undefined {
    return this.cancellationRequests().find(
      (request) => request.enrollmentId === enrollmentId,
    );
  }

  cancellationStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  openCancellationForm(enrollmentId: number): void {
    this.selectedEnrollmentId.set(enrollmentId);
    this.cancellationReason.set('');
    this.cancellationError.set('');
    this.cancellationSuccess.set('');
  }

  closeCancellationForm(): void {
    this.selectedEnrollmentId.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  submitCancellationRequest(): void {
    const enrollmentId = this.selectedEnrollmentId();
    const reason = this.cancellationReason().trim();

    if (enrollmentId === null || !reason) {
      this.cancellationError.set('Please enter a reason for cancellation.');
      return;
    }

    this.isSubmittingCancellation.set(true);
    this.cancellationError.set('');

    this.enrollmentService
      .createCancellationRequest(enrollmentId, { reason })
      .subscribe({
        next: (response) => {
          this.cancellationRequests.update((requests) => [
            response,
            ...requests.filter(
              (request) => request.enrollmentId !== enrollmentId,
            ),
          ]);
          this.isSubmittingCancellation.set(false);
          this.selectedEnrollmentId.set(null);
          this.cancellationReason.set('');
          this.cancellationSuccess.set(
            'Your cancellation request has been submitted successfully.',
          );
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.cancellationError.set(
            body?.detail || body?.message || body?.title ||
            'Unable to submit cancellation request.',
          );
          this.isSubmittingCancellation.set(false);
        },
      });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
