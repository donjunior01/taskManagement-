
// Populate team select options
async function populateTeamSelect(selectId) {
    try {
        const teams = await fetchData('/api/teams');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Team</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });
    } catch (error) {
        showError('Failed to load teams');
    }
}

// Populate project select options
async function populateProjectSelect(selectId) {
    try {
        const projects = await fetchData('/api/projects');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    } catch (error) {
        showError('Failed to load projects');
    }
}

// Populate tasks table
async function populateTasksTable() {
    try {
        showLoading();
        const tasks = await fetchData('/api/tasks');
        const tbody = document.getElementById('tasks-table-body');
        tbody.innerHTML = '';
        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.name}</td>
                <td>${task.assignee}</td>
                <td>${task.priority}</td>
                <td>${task.progress}%</td>
                <td>${task.status}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editTask('${task.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">Delete</button>
                    <button class="btn btn-info btn-sm" onclick="viewMemberDetails('${task.assigneeId}')">Details</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        hideLoading();
    } catch (error) {
        showError('Failed to load tasks');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    switch (page) {
        case 'createProject':
            populateTeamSelect('project-team');
            break;
        case 'teamTask':
            populateTasksTable();
            populateTeamSelect('task-assignee');
            populateProjectSelect('task-project');
            populateTeamSelect('edit-task-assignee');
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
            populateTeamSelect('assign-team-member');
            populateProjectSelect('assign-project');
            break;
        case 'deliverable':
            populateDeliverablesTable();
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

    // Initial badge count update
    updateBadgeCount();

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

    // Form submission handlers (mock implementation)
    const forms = {
        'create-task-form': () => alert('Task created!'),
        'edit-task-form': () => alert('Task updated!'),
        'send-message-form': () => alert('Message sent!'),
        'review-deliverable-form': () => alert('Review submitted!'),
        'add-priority-form': () => alert('Priority level created!'),
        'edit-priority-form': () => alert('Priority level updated!')
    };

    Object.keys(forms).forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                forms[formId]();
                form.closest('.modal').classList.remove('active');
            });
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

