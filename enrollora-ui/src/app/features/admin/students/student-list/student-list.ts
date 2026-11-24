import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { StudentService } from '../student.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { RegisterStudentRequest } from '../../../../core/auth/auth.models';
import { StudentResponse, StudentFilter, UpdateStudentRequest } from '../student.models';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
})
export class StudentList implements OnInit {
  private studentService = inject(StudentService);
  private authService = inject(AuthService);


  students = signal<StudentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(5);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedStudent = signal<StudentResponse | null>(null);
  isDetailsLoading = signal(false);
  detailsError = signal('');
  filters: StudentFilter = {
    search: '',
    status: null,
    department: '',
    minAge: null,
    maxAge: null,
    minCgpa: null,
    maxCgpa: null,
  };

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.getStudents(this.pageNumber(), this.pageSize(), this.filters).subscribe({
      next: (response) => {
        this.students.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.pageNumber.set(response.pageNumber);
        this.pageSize.set(response.pageSize);
        this.isLoading.set(false);

      },

      error: (error) => {
        console.error('Failed to load students:', error);
        this.errorMessage.set('Unable to load students.');
        this.isLoading.set(false);

      },
    });
  }

  approveStudent(id: number): void {
    if (!confirm('Are you sure you want to approve this student?')) {
      return;
    }

    this.studentService.approveStudent(id).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadStudents();
      },
      error: (error) => {
        console.error(error);
        alert('Unable to approve student.');
      },
    });
  }

  rejectStudent(id: number): void {
    if (!confirm('Are you sure you want to reject this student?')) {
      return;
    }

    this.studentService.rejectStudent(id).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadStudents();
      },
      error: (error) => {
        console.error(error);
        alert('Unable to reject student.');
      },
    });
  }

  goToPreviousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadStudents();
    }
  }

  goToNextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadStudents();
    }
  }

  changePageSize(size: string): void {
    this.pageSize.set(Number(size));
    this.pageNumber.set(1);
    this.loadStudents();
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadStudents();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: null,
      department: '',
      minAge: null,
      maxAge: null,
      minCgpa: null,
      maxCgpa: null,
    };

    this.pageNumber.set(1);
    this.loadStudents();
  }

  viewStudent(id: number): void {
    this.selectedStudent.set(null);
    this.isDetailsLoading.set(true);
    this.detailsError.set('');

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.selectedStudent.set(student);
        this.isDetailsLoading.set(false);

      },
      error: (error) => {
        console.error('Failed to load student details:', error);
        this.detailsError.set('Unable to load student details.');
        this.isDetailsLoading.set(false);

      },
    });
  }

  closeStudentDetails(): void {
    this.selectedStudent.set(null);
    this.detailsError.set('');
  }
  isAddStudentModalOpen = signal(false);

  addStudentForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    department: new FormControl('', Validators.required),
    age: new FormControl(18, [Validators.required, Validators.min(17), Validators.max(60)]),
    cgpa: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(10)]),
  });

  openAddStudentModal(): void {
    this.addStudentForm.reset({
      name: '',
      email: '',
      password: '',
      department: '',
      age: 18,
      cgpa: 0,
    });
    this.isAddStudentModalOpen.set(true);
  }

  closeAddStudentModal(): void {
    this.isAddStudentModalOpen.set(false);
    this.addStudentForm.reset({
      name: '',
      email: '',
      password: '',
      department: '',
      age: 18,
      cgpa: 0,
    });
  }

  addStudent(): void {
    if (this.addStudentForm.invalid) {
      this.addStudentForm.markAllAsTouched();
      return;
    }

    const formValue = this.addStudentForm.getRawValue();

    const request: RegisterStudentRequest = {
      name: formValue.name!,
      email: formValue.email!,
      password: formValue.password!,
      department: formValue.department!,
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        alert(response.message);
        this.closeAddStudentModal();
        this.pageNumber.set(1);
        this.loadStudents();
      },
      error: (error) => {
        console.error('Failed to add student:', error);
        alert(error.error?.message || 'Unable to add student.');
      },
    });
  }
  isEditModalOpen = signal(false);
  editingStudentId: number | null = null;

  studentForm = new FormGroup({
    name: new FormControl('', Validators.required),

    email: new FormControl('', [Validators.required, Validators.email]),

    department: new FormControl('', Validators.required),

    age: new FormControl(18, [Validators.required, Validators.min(17), Validators.max(60)]),

    cgpa: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(10)]),
  });

  editStudent(id: number): void {
    this.editingStudentId = id;
    this.isEditModalOpen.set(true);

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.studentForm.patchValue({
          name: student.name,
          email: student.email,
          department: student.department,
          age: student.age,
          cgpa: student.cgpa,
        });
      },
      error: (error) => {
        console.error('Failed to load student details', error);
      },
    });
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingStudentId = null;
    this.studentForm.reset({
      name: '',
      email: '',
      department: '',
      age: 18,
      cgpa: 0,
    });
  }

  updateStudent(): void {
    if (this.studentForm.invalid || this.editingStudentId === null) {
      return;
    }

    const formValue = this.studentForm.getRawValue();

    const studentData: UpdateStudentRequest = {
      name: formValue.name!,
      email: formValue.email!,
      department: formValue.department!,
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.studentService.updateStudent(this.editingStudentId, studentData).subscribe({
      next: (updatedStudent) => {
        console.log('Student updated:', updatedStudent);

        this.closeEditModal();
        this.loadStudents();
      },
      error: (error) => {
        console.error('Failed to update student:', error);
      },
    });
  }

  deleteStudent(id: number): void {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    this.studentService.deleteStudent(id).subscribe({
      next: () => {
        this.loadStudents();
      },
      error: (error) => {
        console.error('Failed to delete student:', error);
      },
    });
  }
}
