// Project Manager Dashboard Features

// Quick search functionality
async function performQuickSearch(query) {
    if (!query.trim()) return;
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        // Display search results in a modal or dropdown
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (results.tasks && results.tasks.length > 0) {
        const taskSection = document.createElement('div');
        taskSection.innerHTML = '<h4>Tasks</h4>';
        results.tasks.forEach(task => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'search-result-item';
            item.innerHTML = `
                <i class="fas fa-tasks"></i>
                <div>
                    <strong>${task.name}</strong>
                    <small>${task.projectName}</small>
                </div>
            `;
            item.onclick = () => navigateToTask(task.id);
            taskSection.appendChild(item);
        });
        container.appendChild(taskSection);
    }
    
    if (results.projects && results.projects.length > 0) {
        const projectSection = document.createElement('div');
        projectSection.innerHTML = '<h4>Projects</h4>';
        results.projects.forEach(project => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'search-result-item';
            item.innerHTML = `
                <i class="fas fa-folder-open"></i>
                <div>
                    <strong>${project.name}</strong>
                    <small>${project.status}</small>
                </div>
            `;
            item.onclick = () => navigateToProject(project.id);
            projectSection.appendChild(item);
        });
        container.appendChild(projectSection);
    }
}

// Navigate to task
function navigateToTask(taskId) {
    // Implementation depends on your routing setup
    window.location.hash = `#task/${taskId}`;
}

// Navigate to project
function navigateToProject(projectId) {
    window.location.hash = `#project/${projectId}`;
}

// Load project detail view
async function loadProjectDetail(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            displayProjectDetail(data.data);
        }
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

// Display project detail
function displayProjectDetail(project) {
    const modal = document.getElementById('project-detail-modal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${project.name}</h2>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="project-detail-row">
                    <label>Status:</label>
                    <span class="badge badge-${project.status.toLowerCase()}">${project.status}</span>
                </div>
                <div class="project-detail-row">
                    <label>Description:</label>
                    <p>${project.description || 'N/A'}</p>
                </div>
                <div class="project-detail-row">
                    <label>Start Date:</label>
                    <span>${new Date(project.startDate).toLocaleDateString()}</span>
                </div>
                <div class="project-detail-row">
                    <label>End Date:</label>
                    <span>${new Date(project.endDate).toLocaleDateString()}</span>
                </div>
                <div class="project-detail-row">
                    <label>Team Members:</label>
                    <ul>
                        ${project.teamMembers?.map(member => 
                            `<li>${member.firstName} ${member.lastName} (${member.role})</li>`
                        ).join('') || '<li>No team members</li>'}
                    </ul>
                </div>
                <div class="project-detail-row">
                    <label>Progress:</label>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.progress}%"></div>
                    </div>
                    <span>${project.progress}%</span>
                </div>
            </div>
        </div>
    `;
}

// Load and display all task columns
async function loadAssignedTasksTable(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/tasks/assigned?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('assigned-tasks-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        data.content.forEach(task => {
            const row = document.createElement('tr');
            const statusClass = `badge-${
                task.status === 'COMPLETED' ? 'success' :
                task.status === 'IN_PROGRESS' ? 'info' :
                task.status === 'OVERDUE' ? 'danger' : 'warning'
            }`;
            
            const priorityClass = `priority-${task.priority.toLowerCase()}`;
            const difficultyClass = `difficulty-${task.difficulty.toLowerCase()}`;
            
            row.innerHTML = `
                <td><strong>${task.name}</strong></td>
                <td>${task.projectName}</td>
                <td>${task.assignedToName}</td>
                <td><span class="badge ${statusClass}">${task.status}</span></td>
                <td><span class="badge ${priorityClass}">${task.priority}</span></td>
                <td><span class="badge ${difficultyClass}">${task.difficulty}</span></td>
                <td>${new Date(task.deadline).toLocaleDateString()}</td>
                <td>
                    <div class="progress-mini">
                        <div class="progress" style="width: ${task.progress}%"></div>
                    </div>
                    ${task.progress}%
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewTaskDetail(${task.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading assigned tasks:', error);
    }
}

// Load and display user profile
async function loadProfilePage() {
    try {
        const response = await fetch('/api/users/profile');
        const data = await response.json();
        
        if (data.success) {
            displayProfileData(data.data);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display profile data
function displayProfileData(profile) {
    document.getElementById('profile-first-name').value = profile.firstName;
    document.getElementById('profile-last-name').value = profile.lastName;
    document.getElementById('profile-email').value = profile.email;
    document.getElementById('profile-username').value = profile.username;
    document.getElementById('profile-role').value = profile.role;
}

// Update password
async function updatePassword(currentPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/users/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password updated successfully', 'success');
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } else {
            showNotification(result.message || 'Error updating password', 'error');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('Error updating password', 'error');
    }
}

// Load PM deliverables
async function loadPMDeliverables(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/deliverables/project?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('pm-deliverables-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        data.content.forEach(deliverable => {
            const row = document.createElement('tr');
            const statusClass = `badge-${
                deliverable.status === 'APPROVED' ? 'success' :
                deliverable.status === 'REJECTED' ? 'danger' : 'warning'
            }`;
            
            row.innerHTML = `
                <td>${deliverable.taskName}</td>
                <td>${deliverable.submittedByName}</td>
                <td>${deliverable.fileName}</td>
                <td><span class="badge ${statusClass}">${deliverable.status}</span></td>
                <td>${new Date(deliverable.createdAt).toLocaleDateString()}</td>
                <td>
                    ${deliverable.status === 'PENDING' ? `
                    <button class="btn btn-sm btn-success" onclick="approveDeliverable(${deliverable.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectDeliverable(${deliverable.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    ` : '<span>' + (deliverable.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected') + '</span>'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading PM deliverables:', error);
    }
}

// Helper functions
function showNotification(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

function closeModal() {
    document.getElementById('project-detail-modal').style.display = 'none';
}

function editTask(taskId) {
    window.location.hash = `#edit-task/${taskId}`;
}

function viewTaskDetail(taskId) {
    window.location.hash = `#task-detail/${taskId}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAssignedTasksTable();
    loadProfilePage();
    loadPMDeliverables();
    
    // Setup search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.length > 2) {
                performQuickSearch(e.target.value);
            }
        });
    }
});
