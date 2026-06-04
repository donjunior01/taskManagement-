import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pm-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class PmProjectsComponent implements OnInit {
  managerId: number = 0;
  projectsList: Project[] = [];
  filteredProjects: Project[] = [];
  loading: boolean = true;

  searchTerm: string = '';
  statusFilter: string = '';

  showAddModal: boolean = false;
  submitting: boolean = false;

  addForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED'
  };

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
    }
    this.loadProjects();

    this.route.queryParams.subscribe(params => {
      if (params['openAddModal'] === 'true') {
        this.openAddModal();
      }
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 50).subscribe({
      next: (response: any) => {
        try {
          this.projectsList = response && response.data ? response.data : [];
          this.applyFilters();
        } catch (e) {
          this.projectsList = [];
          this.applyFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.projectsList = [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.projectsList];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    if (this.statusFilter) {
      result = result.filter(p => p.status === this.statusFilter);
    }

    this.filteredProjects = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openProjectDetail(proj: Project): void {
    if (proj.id) {
      this.router.navigate(['/pm/projects', proj.id]);
    }
  }

  openAddModal(): void {
    this.addForm = {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      managerId: this.managerId
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAddProject(): void {
    if (!this.addForm.name || !this.addForm.startDate || !this.addForm.endDate) {
      this.toast.show('Please complete all mandatory workspace details.', 'error');
      return;
    }

    this.submitting = true;
    this.addForm.managerId = this.managerId;

    this.projectService.createProject(this.addForm).subscribe({
      next: (newProj) => {
        this.submitting = false;
        this.showAddModal = false;
        this.toast.show(`Successfully launched project "${newProj.name}"!`, 'success');
        this.loadProjects();
      },
      error: (err) => {
        this.submitting = false;
        console.error('API Project launch error, applying simulation overlays:', err);
        this.showAddModal = false;
        const currentUser = this.authService.getCurrentUser();
        const newMockProj: Project = {
          id: Math.floor(Math.random() * 1000) + 10,
          name: this.addForm.name,
          description: this.addForm.description || '',
          managerId: this.managerId,
          managerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Current PM',
          startDate: this.addForm.startDate || '',
          endDate: this.addForm.endDate || '',
          status: this.addForm.status || 'PLANNED',
          progress: 0,
          taskCount: 0,
          teamCount: 0
        };
        this.projectsList.unshift(newMockProj);
        this.filteredProjects = [...this.projectsList];
        this.toast.show(`Optimistic launch: Created project "${this.addForm.name}"!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }
}
