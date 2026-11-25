import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { CancellationResponse } from '../../enrollments/enrollment.models';
import { EnrollmentService } from '../../enrollments/enrollment.service';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequests implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService
      .getCancellationRequests(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading cancellation requests:', error);
          this.errorMessage.set(
            error.error?.detail || error.error?.message ||
            'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  approveRequest(request: CancellationResponse): void {
    if (request.status !== 0) return;

    this.enrollmentService
      .approveCancellationRequest(request.cancellationRequestId, {})
      .subscribe({
        next: () => {
          this.successMessage.set('Cancellation request approved successfully.');
          this.loadRequests();
        },
        error: (error) => {
          this.errorMessage.set(
            error.error?.detail || error.error?.message ||
            'Unable to approve cancellation request.',
          );
        },
      });
  }

  rejectRequest(request: CancellationResponse): void {
    if (request.status !== 0) return;

    this.enrollmentService
      .rejectCancellationRequest(request.cancellationRequestId, {})
      .subscribe({
        next: () => {
          this.successMessage.set('Cancellation request rejected successfully.');
          this.loadRequests();
        },
        error: (error) => {
          this.errorMessage.set(
            error.error?.detail || error.error?.message ||
            'Unable to reject cancellation request.',
          );
        },
      });
  }

  statusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }
}
