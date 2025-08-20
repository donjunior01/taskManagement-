
// Populate team select options
async function populateTeamSelect(selectId) {
    try {
        const teams = await fetchData('/api/teams');
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Team</option>';
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load teams:', error);
        showError('Failed to load teams');
    }
}

// Populate project select options
async function populateProjectSelect(selectId) {
    try {
        const projects = await fetchData('/api/projects');
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Project</option>';
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
    }
}

// Populate employees (users with EMPLOYEE role) for task assignment
async function populateEmployees(selectId) {
    try {
        const employees = await fetchData('/api/pm/employees');
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Employee</option>';
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = employee.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load employees:', error);
        showError('Failed to load employees');
    }
}

// Populate managers for manager selection dropdowns
async function populateManagers(selectId) {
    try {
        const managers = await fetchData('/api/pm/managers');
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Manager</option>';
            managers.forEach(manager => {
                const option = document.createElement('option');
                option.value = manager.id;
                option.textContent = manager.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load managers:', error);
        showError('Failed to load managers');
    }
}

// Initialize manager dropdowns on page load
function initializeManagerDropdowns() {
    // Populate manager dropdowns for project management
    const projectManagerSelects = ['project-manager', 'edit-project-manager'];
    projectManagerSelects.forEach(selectId => {
        if (document.getElementById(selectId)) {
            populateManagers(selectId);
        }
    });
    
    // Populate manager dropdowns for admin dashboard
    const adminManagerSelects = ['admin-project-manager'];
    adminManagerSelects.forEach(selectId => {
        if (document.getElementById(selectId)) {
            populateManagers(selectId);
        }
    });
}

// Populate tasks table
async function populateTasksTable() {
    try {
        showLoading();
        const tasks = await fetchData('/api/tasks');
        const tbody = document.getElementById('tasks-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            tasks.forEach(task => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${task.title || task.name || ''}</td>
                    <td>${task.assignee || ''}</td>
                    <td>${task.priority || ''}</td>
                    <td>${task.progress || 0}%</td>
                    <td>${task.status || ''}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editTask('${task.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        hideLoading();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        showError('Failed to load tasks');
        hideLoading();
    }
}

// Populate messages table
async function populateMessagesTable() {
    try {
        const messages = await fetchData('/api/pm/messages');
        const tbody = document.getElementById('messages-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            messages.forEach(message => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${message.title || ''}</td>
                    <td>${message.preview || ''}</td>
                    <td>${message.time || ''}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="viewMessage('${message.id}')">View</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMessage('${message.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
        showError('Failed to load messages');
    }
}

// Populate analytics table
async function populateAnalyticsTable() {
    try {
        const analytics = await fetchData('/api/reports');
        const tbody = document.getElementById('analytics-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            // Process analytics data and populate table
            // This would depend on the specific analytics structure
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
        showError('Failed to load analytics');
    }
}

// Populate non-compliant users table
async function populateNonCompliantUsersTable() {
    try {
        const users = await fetchData('/api/admin/users');
        const tbody = document.getElementById('non-compliant-users-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name || ''}</td>
                    <td>${user.email || ''}</td>
                    <td>${user.role || ''}</td>
                    <td>${user.status || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="warnUser('${user.id}')">Warn</button>
                        <button class="btn btn-danger btn-sm" onclick="suspendUser('${user.id}')">Suspend</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load non-compliant users:', error);
        showError('Failed to load non-compliant users');
    }
}

// Populate assignments table
async function populateAssignmentsTable() {
    try {
        const assignments = await fetchData('/api/pm/task-assignments');
        const tbody = document.getElementById('assignments-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            assignments.forEach(assignment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${assignment.taskTitle || ''}</td>
                    <td>${assignment.assignedToName || ''}</td>
                    <td>${assignment.assignedAt || ''}</td>
                    <td>${assignment.assignmentStatus || ''}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editAssignment('${assignment.assignmentId}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteAssignment('${assignment.assignmentId}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load assignments:', error);
        showError('Failed to load assignments');
    }
}

// Populate deliverables table
async function populateDeliverablesTable() {
    try {
        const deliverables = await fetchData('/api/deliverables');
        const tbody = document.getElementById('deliverables-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            deliverables.forEach(deliverable => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${deliverable.taskTitle || ''}</td>
                    <td>${deliverable.submittedBy || ''}</td>
                    <td>${deliverable.submittedAt || ''}</td>
                    <td>${deliverable.status || ''}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="reviewDeliverable('${deliverable.id}')">Review</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteDeliverable('${deliverable.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load deliverables:', error);
        showError('Failed to load deliverables');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    switch (page) {
        case 'pmDashboard':
            // Manager dashboard content
            initPMDashboard();
            // Populate selects in create task modal, if present
            populateEmployees('task-assignee');
            populateProjectSelect('task-project');
            break;
        case 'createProject':
            populateTeamSelect('project-team');
            break;
        case 'teamTask':
            populateTasksTable();
            populateEmployees('task-assignee');
            populateProjectSelect('task-project');
            populateEmployees('edit-task-assignee');
            populateProjectSelect('edit-task-project');
            initCharts(); // Initialize team-performance-chart and task-status-chart
            break;
        case 'teamCommunication':
            populateMessagesTable();
            populateTeamSelect('message-recipient');
            break;
        case 'reportsAndAnalytics':
            populateAnalyticsTable();
            initCharts(); // Initialize productivity-trends-chart, task-completion-chart, team-performance-chart
            break;
        case 'nonCompliatUsers':
            populateNonCompliantUsersTable();
            break;
        case 'teamAssignment':
            populateAssignmentsTable();
            populateEmployees('assign-team-member');
            populateProjectSelect('assign-project');
            break;
        case 'deliverable':
            populateDeliverablesTable();
            break;
        case 'projectManagement':
            populateManagers('project-manager');
            populateManagers('edit-project-manager');
            populateTeamSelect('project-team');
            populateTeamSelect('edit-project-team');
            break;
        case 'adminDashboard':
            populateManagers('project-manager');
            break;
        case 'userManagement':
            // User management page initialization
            break;
        case 'globalTasks':
            // Global tasks page initialization
            break;
        case 'globalReports':
            // Global reports page initialization
            break;
        case 'teamPerformance':
            // Team performance page initialization
            break;
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';


    // Apply saved theme on load
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Set active navigation item based on current page
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    document.querySelectorAll('.nav-item').forEach(item => {
        const pageId = item.getAttribute('data-page');
        if (pageId === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Page navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            const href = this.getAttribute('href');

            if (pageId && pageId !== 'logout' && href) {
                window.location.href = href;
            } else if (this.id === 'logout-link') {
                fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => {
                        if (response.redirected) {
                            window.location.href = response.url;
                        } else {
                            return response.json();
                        }
                    })
                    .then(data => {
                        if (data) {
                            window.location.href = '/api/auth/login?logout=true';
                        }
                    })
                    .catch(error => {
                        console.error('Logout failed:', error);
                        alert('An error occurred during logout. Please try again.');
                    });
            }

            // Close secondary sidebar and mobile menu when navigating
            closeSecondarySidebar();
            document.querySelector('.sidebar').classList.remove('mobile-open');
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });

    // Close mobile menu when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Secondary sidebar functionality
    const secondarySidebar = document.getElementById('secondary-sidebar');
    const sidebarTriggers = document.querySelectorAll('.notifications, .messages, .user-settings-icon');
    const sidebarContents = document.querySelectorAll('.sidebar-content');
    const notificationCount = document.getElementById('notification-count');
    const messageCount = document.getElementById('message-count');
    const deleteModal = document.getElementById('delete-confirmation');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const closeButtons = document.querySelectorAll('.close-btn, .modal-close');
    const modals = document.querySelectorAll('.modal');
    let itemsToDelete = [];

    function closeSecondarySidebar() {
        secondarySidebar.classList.remove('active');
        sidebarContents.forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.message-content').forEach(content => content.classList.remove('active'));
    }

    // Toggle sidebar on trigger click
    sidebarTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const sidebarId = this.getAttribute('data-sidebar');

            if (secondarySidebar.classList.contains('active') &&
                document.getElementById(`${sidebarId}-content`).classList.contains('active')) {
                closeSecondarySidebar();
            } else {
                closeSecondarySidebar();
                secondarySidebar.classList.add('active');
                document.getElementById(`${sidebarId}-content`).classList.add('active');
            }
        });
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (!secondarySidebar.contains(e.target) && !e.target.closest('.notification-icons')) {
            closeSecondarySidebar();
        }
    });

    // Message click handler
    document.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            if (e.target.classList.contains('message-checkbox') || e.target.classList.contains('delete-message')) {
                return;
            }
            const content = this.querySelector('.message-content');

            content.classList.toggle('active');

            document.querySelectorAll('.message-content').forEach(c => {
                if (c !== content) c.classList.remove('active');
            });

            if (this.classList.contains('unread')) {
                this.classList.remove('unread');
                updateBadgeCount();
            }
        });
    });

    // Delete message handler
    document.querySelectorAll('.delete-message').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            itemsToDelete = [this.closest('.message-item').getAttribute('data-id')];
            showDeleteConfirmation(this.closest('.sidebar-content').id);
        });
    });

    // Mark all read handler
    document.querySelectorAll('.mark-all-read').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            document.querySelectorAll(`#${type}-content .message-item.unread`).forEach(item => {
                item.classList.remove('unread');
            });
            updateBadgeCount();
        });
    });

    // Delete selected handler
    document.querySelectorAll('.delete-selected').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            itemsToDelete = Array.from(document.querySelectorAll(`#${type}-content .message-checkbox:checked`))
                .map(checkbox => checkbox.closest('.message-item').getAttribute('data-id'));
            if (itemsToDelete.length > 0) {
                showDeleteConfirmation(`${type}-content`);
            }
        });
    });

    // Show delete confirmation modal
    function showDeleteConfirmation(contentId) {
        deleteModal.classList.add('active');
        confirmDeleteBtn.onclick = () => {
            itemsToDelete.forEach(id => {
                const item = document.querySelector(`#${contentId} .message-item[data-id="${id}"]`);
                if (item) item.remove();
            });
            updateBadgeCount();
            deleteModal.classList.remove('active');
            itemsToDelete = [];
        };
    }

    // Cancel delete
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.remove('active');
        itemsToDelete = [];
    });

    // Update badge counts
    function updateBadgeCount() {
        const unreadNotifications = document.querySelectorAll('#notifications-content .message-item.unread').length;
        const unreadMessages = document.querySelectorAll('#messages-content .message-item.unread').length;

        notificationCount.textContent = unreadNotifications;
        notificationCount.style.display = unreadNotifications > 0 ? 'flex' : 'none';
        messageCount.textContent = unreadMessages;
        messageCount.style.display = unreadMessages > 0 ? 'flex' : 'none';
    }

    // Load notifications and messages for secondary sidebar
    async function loadNotificationsAndMessages() {
        try {
            // Load notifications
            const notifications = await fetchData('/api/notifications');
            const notificationsContent = document.getElementById('notifications-content');
            if (notificationsContent) {
                // remove old items, keep header
                notificationsContent.querySelectorAll('.message-item').forEach(n => n.remove());
                notifications.forEach(notification => {
                    const item = document.createElement('div');
                    item.className = `message-item ${notification.read ? '' : 'unread'}`;
                    item.setAttribute('data-id', notification.id);
                    item.innerHTML = `
                        <input type="checkbox" class="message-checkbox">
                        <div class="message-body">
                            <div class="message-title">${notification.title || 'Notification'}</div>
                            <div class="message-preview">${notification.message || ''}</div>
                            <div class="message-time">${notification.createdAt || ''}</div>
                            <div class="message-content">${notification.message || ''}</div>
                        </div>
                        <button class="btn btn-danger delete-message" data-id="${notification.id}" onclick="deleteNotification('${notification.id}')"><i class="fas fa-trash"></i></button>
                    `;
                    notificationsContent.appendChild(item);
                });
            }

            // Load messages
            const messages = await fetchData('/api/pm/messages');
            const messagesContent = document.getElementById('messages-content');
            if (messagesContent) {
                // remove old items, keep header
                messagesContent.querySelectorAll('.message-item').forEach(n => n.remove());
                messages.forEach(message => {
                    const item = document.createElement('div');
                    item.className = `message-item ${message.unread ? 'unread' : ''}`;
                    item.setAttribute('data-id', message.id);
                    item.innerHTML = `
                        <input type="checkbox" class="message-checkbox">
                        <div class="message-body">
                            <div class="message-title">${message.title || 'Message'}</div>
                            <div class="message-preview">${message.preview || message.content || ''}</div>
                            <div class="message-time">${message.time || ''}</div>
                            <div class="message-content">${message.content || ''}</div>
                        </div>
                        <button class="btn btn-danger delete-message" data-id="${message.id}" onclick="deleteMessage('${message.id}')"><i class="fas fa-trash"></i></button>
                    `;
                    messagesContent.appendChild(item);
                });
            }

            // Update badge counts
            updateBadgeCount();
        } catch (error) {
            console.error('Failed to load notifications and messages:', error);
        }
    }

    // Delete notification
    window.deleteNotification = async function(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const item = document.querySelector(`#notifications-content .message-item[data-id="${notificationId}"]`);
                if (item) item.remove();
                updateBadgeCount();
                showSuccess('Notification deleted successfully!');
            } else {
                showError('Failed to delete notification');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            showError('Failed to delete notification');
        }
    };

    // Delete message
    window.deleteMessage = async function(messageId) {
        try {
            const response = await fetch(`/api/pm/messages/${messageId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const item = document.querySelector(`#messages-content .message-item[data-id="${messageId}"]`);
                if (item) item.remove();
                updateBadgeCount();
                showSuccess('Message deleted successfully!');
            } else {
                showError('Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            showError('Failed to delete message');
        }
    };

    // Utility functions
    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    function showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    function hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    function showSuccess(message) {
        // You can implement a toast notification system here
        console.log('Success:', message);
        alert(message);
    }

    function showError(message) {
        // You can implement a toast notification system here
        console.error('Error:', message);
        alert(message);
    }

    // Initialize charts
    function initCharts() {
        // Initialize any charts if needed
        console.log('Charts initialized');
    }

    async function initPMDashboard() {
        try {
            // Load manager stats
            const stats = await fetchData('/api/manager/dashboard-stats');
            if (stats) {
                const mappings = {
                    'team-members': stats.totalProjects || 0, // adjust if team service exists
                    'active-tasks': stats.activeTasks || 0,
                    'overdue-tasks': stats.overdueTasks || 0,
                    'completion-rate': (stats.completedTasks && stats.totalTasks) ? Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100) + '%' : '0%'
                };
                Object.keys(mappings).forEach(key => {
                    const el = document.querySelector(`[data-stat="${key}"] h3`);
                    if (el) el.textContent = mappings[key];
                });
            }

            // Load recent messages for sidebar
            loadNotificationsAndMessages();
        } catch (e) {
            console.error('Failed to init PM dashboard', e);
        }
    }

    // Initial badge count update
    updateBadgeCount();
    
    // Load notifications and messages on page load
    loadNotificationsAndMessages();

    // Close modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Edit task modal population (simplified example)
    document.querySelectorAll('.edit-task-btn').forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.getAttribute('data-task-id');
            const modal = document.getElementById('edit-task-modal');
            // Populate modal fields (mock data)
            document.getElementById('edit-task-id').value = taskId;
            document.getElementById('edit-task-name').value = 'Design Landing Page';
            document.getElementById('edit-task-description').value = 'Create landing page for Q2 campaign';
            document.getElementById('edit-task-assignee').value = 'jane-smith';
            document.getElementById('edit-task-priority').value = 'high';
            document.getElementById('edit-task-deadline').value = '2025-08-10';
            document.getElementById('edit-task-difficulty').value = 'medium';
            document.getElementById('edit-task-progress').value = '50';
            modal.classList.add('active');
        });
    });

    // Review deliverable modal population (simplified example)
    document.querySelectorAll('.review-deliverable-btn').forEach(button => {
        button.addEventListener('click', () => {
            const deliverableId = button.getAttribute('data-deliverable-id');
            const modal = document.getElementById('review-deliverable-modal');
            // Populate modal fields (mock data)
            document.getElementById('deliverable-id').value = deliverableId;
            document.getElementById('deliverable-task').textContent = 'Design Landing Page';
            document.getElementById('deliverable-submitted-by').textContent = 'Jane Smith';
            document.getElementById('deliverable-file').textContent = 'design_mockup.pdf';
            document.getElementById('deliverable-status').value = 'pending';
            document.getElementById('deliverable-comments').value = '';
            modal.classList.add('active');
        });
    });

    // CRUD Operations
    window.createTask = async function(formData) {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const created = await response.json();
                showSuccess('Task created successfully!');
                populateTasksTable();
                return created;
            } else {
                showError('Failed to create task');
                return null;
            }
        } catch (error) {
            console.error('Error creating task:', error);
            showError('Failed to create task');
            return null;
        }
    };

    window.editTask = async function(taskId) {
        try {
            const task = await fetchData(`/api/tasks/${taskId}`);
            if (task) {
                // Populate edit form
                document.getElementById('edit-task-id').value = task.id;
                document.getElementById('edit-task-name').value = task.title || '';
                document.getElementById('edit-task-description').value = task.description || '';
                document.getElementById('edit-task-assignee').value = task.assignee || '';
                document.getElementById('edit-task-priority').value = task.priority || '';
                document.getElementById('edit-task-deadline').value = task.deadline || '';
                document.getElementById('edit-task-difficulty').value = task.difficulty || '';
                document.getElementById('edit-task-progress').value = task.progress || 0;
                
                // Open edit modal
                document.getElementById('edit-task-modal').classList.add('active');
            }
        } catch (error) {
            console.error('Error loading task:', error);
            showError('Failed to load task details');
        }
    };

    window.updateTask = async function(formData) {
        try {
            const response = await fetch(`/api/tasks/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showSuccess('Task updated successfully!');
                populateTasksTable();
                return true;
            } else {
                showError('Failed to update task');
                return false;
            }
        } catch (error) {
            console.error('Error updating task:', error);
            showError('Failed to update task');
            return false;
        }
    };

    window.deleteTask = async function(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showSuccess('Task deleted successfully!');
                    populateTasksTable();
                } else {
                    showError('Failed to delete task');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showError('Failed to delete task');
            }
        }
    };

    window.assignTask = async function(formData) {
        try {
            const response = await fetch('/api/pm/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showSuccess('Task assigned successfully!');
                populateAssignmentsTable();
                return true;
            } else {
                showError('Failed to assign task');
                return false;
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            showError('Failed to assign task');
            return false;
        }
    };

    // Form submission handlers
    const forms = {
        'create-task-form': async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const title = formData.get('title') || formData.get('name') || document.getElementById('task-title')?.value || document.getElementById('task-name')?.value || '';
            const description = formData.get('description') || document.getElementById('task-description')?.value || '';
            const projectId = formData.get('projectId') || formData.get('project') || document.getElementById('task-project')?.value || '';
            const priority = formData.get('priority') || document.getElementById('task-priority')?.value || '';
            const deadline = formData.get('deadline') || document.getElementById('task-deadline')?.value || '';
            const difficulty = formData.get('difficulty') || document.getElementById('task-difficulty')?.value || '';
            const assigneeId = formData.get('assigneeId') || formData.get('assignee') || document.getElementById('task-assignee')?.value || '';
            const taskData = { title, description, projectId, priority, deadline, difficulty };
            
            const created = await createTask(taskData);
            if (created && created.id && assigneeId) {
                await assignTask({ taskId: created.id, assignedToId: assigneeId, assignmentNotes: '' });
            }
            if (created) {
                e.target.closest('.modal').classList.remove('active');
                e.target.reset();
            }
        },
        'edit-task-form': async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const id = formData.get('id') || formData.get('edit-task-id') || document.getElementById('edit-task-id')?.value || '';
            const title = formData.get('title') || formData.get('name') || formData.get('edit-task-name') || document.getElementById('edit-task-title')?.value || document.getElementById('edit-task-name')?.value || '';
            const description = formData.get('description') || formData.get('edit-task-description') || document.getElementById('edit-task-description')?.value || '';
            const projectId = formData.get('projectId') || formData.get('project') || formData.get('edit-task-project') || document.getElementById('edit-task-project')?.value || '';
            const priority = formData.get('priority') || formData.get('edit-task-priority') || document.getElementById('edit-task-priority')?.value || '';
            const deadline = formData.get('deadline') || formData.get('edit-task-deadline') || document.getElementById('edit-task-deadline')?.value || '';
            const difficulty = formData.get('difficulty') || formData.get('edit-task-difficulty') || document.getElementById('edit-task-difficulty')?.value || '';
            const progress = formData.get('progress') || formData.get('edit-task-progress') || document.getElementById('edit-task-progress')?.value || '';
            const taskData = { id, title, description, projectId, priority, deadline, difficulty, progress };
            
            const success = await updateTask(taskData);
            if (success) {
                e.target.closest('.modal').classList.remove('active');
            }
        },
        'assign-task-form': async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const assignmentData = {
                taskId: formData.get('assign-task'),
                assignedToId: formData.get('assign-team-member'),
                assignmentNotes: formData.get('assignment-notes')
            };
            
            const success = await assignTask(assignmentData);
            if (success) {
                e.target.closest('.modal').classList.remove('active');
                e.target.reset();
            }
        },
        'send-message-form': (e) => {
            e.preventDefault();
            showSuccess('Message sent!');
            e.target.closest('.modal').classList.remove('active');
            e.target.reset();
        },
        'review-deliverable-form': (e) => {
            e.preventDefault();
            showSuccess('Review submitted!');
            e.target.closest('.modal').classList.remove('active');
            e.target.reset();
        },
        'add-priority-form': (e) => {
            e.preventDefault();
            showSuccess('Priority level created!');
            e.target.closest('.modal').classList.remove('active');
            e.target.reset();
        },
        'edit-priority-form': (e) => {
            e.preventDefault();
            showSuccess('Priority level updated!');
            e.target.closest('.modal').classList.remove('active');
            e.target.reset();
        }
    };

    Object.keys(forms).forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', forms[formId]);
        }
    });

    // Global modal functions
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    };
});

