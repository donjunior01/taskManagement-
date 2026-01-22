// User Dashboard Features

// Load weekly progress chart
async function loadWeeklyProgressChart() {
    try {
        const response = await fetch('/api/dashboard/user/stats');
        const stats = await response.json();
        
        // Get last 7 days data
        const daysData = await fetchWeeklyProgressData();
        
        const ctx = document.getElementById('userWeeklyProgressChart');
        if (!ctx) return;
        
        if (window.userProgressChart) {
            window.userProgressChart.destroy();
        }
        
        window.userProgressChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: daysData.days,
                datasets: [{
                    label: 'Tasks Completed',
                    data: daysData.completed,
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Tasks Started',
                    data: daysData.started,
                    borderColor: '#26c6da',
                    backgroundColor: 'rgba(38, 198, 218, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading weekly progress chart:', error);
    }
}

// Fetch weekly progress data
async function fetchWeeklyProgressData() {
    try {
        const response = await fetch('/api/tasks/weekly-progress');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weekly progress:', error);
        // Return dummy data
        return {
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            completed: [2, 3, 2, 4, 3, 1, 0],
            started: [3, 2, 4, 3, 5, 2, 1]
        };
    }
}

// Load user tasks with deliverable button
async function loadUserTasksWithDeliverables(page = 0, size = 10, filter = 'all') {
    try {
        let url = `/api/tasks/my-tasks?page=${page}&size=${size}`;
        if (filter !== 'all') {
            url += `&status=${filter}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const tableBody = document.getElementById('my-tasks-body');
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
            
            row.innerHTML = `
                <td><strong>${task.name}</strong></td>
                <td>${task.projectName}</td>
                <td><span class="badge ${statusClass}">${task.status}</span></td>
                <td><span class="badge ${priorityClass}">${task.priority}</span></td>
                <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="progress-mini">
                        <div class="progress" style="width: ${task.progress}%"></div>
                    </div>
                    ${task.progress}%
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showSubmitDeliverableModal(${task.id}, '${task.name}')">
                        <i class="fas fa-file-upload"></i> Submit Deliverable
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading user tasks:', error);
    }
}

// Filter tasks
function filterUserTasks(status) {
    loadUserTasksWithDeliverables(0, 10, status);
}

// Show submit deliverable modal
function showSubmitDeliverableModal(taskId, taskName) {
    const modal = document.getElementById('submit-deliverable-modal');
    if (!modal) {
        createDeliverableModal();
    }
    
    document.getElementById('deliverable-task-id').value = taskId;
    document.getElementById('deliverable-task-name').textContent = taskName;
    modal.style.display = 'block';
}

// Create deliverable modal
function createDeliverableModal() {
    const modal = document.createElement('div');
    modal.id = 'submit-deliverable-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Submit Deliverable</h3>
                <button class="close-btn" onclick="closeDeliverableModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Task: <span id="deliverable-task-name"></span></label>
                </div>
                <div class="form-group">
                    <label for="deliverable-file">Select File:</label>
                    <input type="file" id="deliverable-file" class="form-control">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="submitDeliverable()">Submit</button>
                <button class="btn btn-secondary" onclick="closeDeliverableModal()">Cancel</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'none';
    document.body.appendChild(modal);
}

// Submit deliverable
async function submitDeliverable() {
    const taskId = document.getElementById('deliverable-task-id').value;
    const fileInput = document.getElementById('deliverable-file');
    
    if (!fileInput.files.length) {
        showNotification('Please select a file', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('taskId', taskId);
    
    try {
        const response = await fetch('/api/deliverables/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Deliverable submitted successfully', 'success');
            closeDeliverableModal();
            loadUserDeliverables();
        } else {
            showNotification(result.message || 'Error submitting deliverable', 'error');
        }
    } catch (error) {
        console.error('Error submitting deliverable:', error);
        showNotification('Error submitting deliverable', 'error');
    }
}

// Close deliverable modal
function closeDeliverableModal() {
    const modal = document.getElementById('submit-deliverable-modal');
    if (modal) modal.style.display = 'none';
}

// Load user deliverables
async function loadUserDeliverables(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/deliverables/user/mine?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('user-deliverables-body');
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
                <td>${deliverable.fileName}</td>
                <td><span class="badge ${statusClass}">${deliverable.status}</span></td>
                <td>${new Date(deliverable.createdAt).toLocaleDateString()}</td>
                <td>${deliverable.comments || 'No comments'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="downloadFile('${deliverable.fileUrl}', '${deliverable.fileName}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading user deliverables:', error);
    }
}

// Log time submission and loading
async function loadTimeTracking(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/time-logs/user/my-logs?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('time-tracking-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        data.content.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.logDate).toLocaleDateString()}</td>
                <td>${log.taskName}</td>
                <td>${log.hoursLogged} hours</td>
                <td>${log.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editTimeLog(${log.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTimeLog(${log.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading time tracking:', error);
    }
}

// Submit time log
async function submitTimeLog(taskId, hoursLogged, description) {
    try {
        const response = await fetch('/api/time-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskId: taskId,
                hoursLogged: hoursLogged,
                description: description,
                logDate: new Date().toISOString().split('T')[0]
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Time logged successfully', 'success');
            loadTimeTracking();
            // Clear form
            document.getElementById('log-hours-input').value = '';
            document.getElementById('log-description').value = '';
        } else {
            showNotification(result.message || 'Error logging time', 'error');
        }
    } catch (error) {
        console.error('Error logging time:', error);
        showNotification('Error logging time', 'error');
    }
}

// Edit time log
async function editTimeLog(logId) {
    try {
        const response = await fetch(`/api/time-logs/${logId}`);
        const result = await response.json();
        
        if (result.success) {
            const log = result.data;
            document.getElementById('edit-log-hours').value = log.hoursLogged;
            document.getElementById('edit-log-description').value = log.description;
            document.getElementById('edit-time-log-modal').style.display = 'block';
            document.getElementById('edit-log-id').value = logId;
        }
    } catch (error) {
        console.error('Error loading time log:', error);
    }
}

// Delete time log
async function deleteTimeLog(logId) {
    if (confirm('Are you sure you want to delete this time log?')) {
        try {
            const response = await fetch(`/api/time-logs/${logId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Time log deleted successfully', 'success');
                loadTimeTracking();
            }
        } catch (error) {
            console.error('Error deleting time log:', error);
            showNotification('Error deleting time log', 'error');
        }
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

function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWeeklyProgressChart();
    loadUserTasksWithDeliverables();
    loadUserDeliverables();
    loadTimeTracking();
    
    // Add event listeners for task filters if they exist
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterUserTasks(filter);
        });
    });
});
