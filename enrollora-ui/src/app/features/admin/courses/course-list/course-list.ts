import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  isCreateModalOpen = signal(false);
  isSaving = signal(false);
  createError = signal('');

  newCourse: SaveCourseRequest = {
    courseName: '',
    duration: '',
    fees: 0,
    capacity: 1,
    isActive: true,
  };

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set('Unable to load courses.');
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.newCourse = {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
    this.createError.set('');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isCreateModalOpen.set(false);
    this.createError.set('');
  }

  createCourse(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.createError.set('');

    const request: SaveCourseRequest = { ...this.newCourse };

    this.courseService.createCourse(request).subscribe({
      next: (response) => {
        console.log('Course created successfully:', response);

        this.isSaving.set(false);
        this.isCreateModalOpen.set(false);

        this.newCourse = {
          courseName: '',
          duration: '',
          fees: 0,
          capacity: 1,
          isActive: true,
        };

        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error creating course:', error);

        this.createError.set(
          error?.error?.message || 'Unable to create course. Please try again.',
        );

        this.isSaving.set(false);
      },
    });
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}

