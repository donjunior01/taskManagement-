// Dashboard Data Management System
class DashboardDataManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.apiBaseUrl = '/api';
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.loadPageData();
    }

    // Load current user information
    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/current-user`, {
                credentials: 'include'
            });
            if (response.ok) {
                this.currentUser = await response.json();
                this.currentRole = this.currentUser.role;
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    // Update UI based on user role
    updateUserInterface() {
        if (this.currentUser) {
            // Update user name in top bar
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name || this.currentUser.username;
            }

            // Update user avatar
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) {
                userAvatar.src = this.currentUser.avatar || '/images/default-avatar.png';
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation event listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href && !item.id.includes('logout')) {
                    this.navigateToPage(href);
                }
            });
        });

        // Modal event listeners
        this.setupModalEventListeners();
        
        // Form submission listeners
        this.setupFormEventListeners();
    }

    // Setup modal event listeners
    setupModalEventListeners() {
        // Close modal buttons
        document.querySelectorAll('.modal-close, .btn-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-id');
                const itemType = button.getAttribute('data-type');
                this.openEditModal(itemType, itemId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-id');
                const itemType = button.getAttribute('data-type');
                this.openDeleteModal(itemType, itemId);
            });
        });
    }

    // Setup form event listeners
    setupFormEventListeners() {
        // Create task form
        const createTaskForm = document.getElementById('create-task-form');
        if (createTaskForm) {
            createTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCreateTask();
            });
        }

        // Edit task form
        const editTaskForm = document.getElementById('edit-task-form');
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitEditTask();
            });
        }

        // Create project form
        const createProjectForm = document.getElementById('create-project-form');
        if (createProjectForm) {
            createProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCreateProject();
            });
        }
    }

    // Load page-specific data
    async loadPageData() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'tasks':
                await this.loadTasksData();
                break;
            case 'projects':
                await this.loadProjectsData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
            case 'notifications':
                await this.loadNotificationsData();
                break;
            case 'calendar':
                await this.loadCalendarData();
                break;
            case 'time-tracking':
                await this.loadTimeTrackingData();
                break;
            case 'collaboration':
                await this.loadCollaborationData();
                break;
            default:
                console.log('No specific data loading for page:', currentPage);
        }
    }

    // Get current page name
    getCurrentPage() {
        const path = window.location.pathname;
        const segments = path.split('/');
        return segments[segments.length - 1] || 'dashboard';
    }

    // Load dashboard data based on user role
    async loadDashboardData() {
        try {
            let endpoint = '';
            switch (this.currentRole) {
                case 'ADMIN':
                    endpoint = `${this.apiBaseUrl}/admin/dashboard-stats`;
                    break;
                case 'MANAGER':
                    endpoint = `${this.apiBaseUrl}/manager/dashboard-stats`;
                    break;
                case 'USER':
                    endpoint = `${this.apiBaseUrl}/user/dashboard-stats`;
                    break;
            }

            if (endpoint) {
                const response = await fetch(endpoint, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    this.updateDashboardStats(data);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Load tasks data
    async loadTasksData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks`, {
                credentials: 'include'
            });
            if (response.ok) {
                const tasks = await response.json();
                this.updateTasksList(tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Load projects data
    async loadProjectsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`, {
                credentials: 'include'
            });
            if (response.ok) {
                const projects = await response.json();
                this.updateProjectsList(projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // Load users data (admin only)
    async loadUsersData() {
        if (this.currentRole !== 'ADMIN') return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/users`, {
                credentials: 'include'
            });
            if (response.ok) {
                const users = await response.json();
                this.updateUsersList(users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Load reports data
    async loadReportsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reports`, {
                credentials: 'include'
            });
            if (response.ok) {
                const reports = await response.json();
                this.updateReportsList(reports);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    // Load notifications data
    async loadNotificationsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications`, {
                credentials: 'include'
            });
            if (response.ok) {
                const notifications = await response.json();
                this.updateNotificationsList(notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // Load calendar data
    async loadCalendarData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/calendar/events`, {
                credentials: 'include'
            });
            if (response.ok) {
                const events = await response.json();
                this.updateCalendarEvents(events);
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    // Load time tracking data
    async loadTimeTrackingData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/time-tracking`, {
                credentials: 'include'
            });
            if (response.ok) {
                const timeData = await response.json();
                this.updateTimeTrackingData(timeData);
            }
        } catch (error) {
            console.error('Error loading time tracking data:', error);
        }
    }

    // Load collaboration data
    async loadCollaborationData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/collaboration`, {
                credentials: 'include'
            });
            if (response.ok) {
                const collaborationData = await response.json();
                this.updateCollaborationData(collaborationData);
            }
        } catch (error) {
            console.error('Error loading collaboration data:', error);
        }
    }

    // Update dashboard statistics
    updateDashboardStats(data) {
        // Update stat cards
        if (data.totalTasks !== undefined) {
            const totalTasksElement = document.querySelector('.stat-card[data-stat="total-tasks"] .stat-info h3');
            if (totalTasksElement) {
                totalTasksElement.textContent = data.totalTasks;
            }
        }

        if (data.activeTasks !== undefined) {
            const activeTasksElement = document.querySelector('.stat-card[data-stat="active-tasks"] .stat-info h3');
            if (activeTasksElement) {
                activeTasksElement.textContent = data.activeTasks;
            }
        }

        if (data.completedTasks !== undefined) {
            const completedTasksElement = document.querySelector('.stat-card[data-stat="completed-tasks"] .stat-info h3');
            if (completedTasksElement) {
                completedTasksElement.textContent = data.completedTasks;
            }
        }

        if (data.overdueTasks !== undefined) {
            const overdueTasksElement = document.querySelector('.stat-card[data-stat="overdue-tasks"] .stat-info h3');
            if (overdueTasksElement) {
                overdueTasksElement.textContent = data.overdueTasks;
            }
        }

        // Update charts if they exist
        if (data.chartData) {
            this.updateCharts(data.chartData);
        }
    }

    // Update tasks list
    updateTasksList(tasks) {
        const tasksContainer = document.querySelector('.tasks-list');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }

    // Create task element
    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.setAttribute('data-task-id', task.id);
        
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <span class="task-assignee">${task.assignee}</span>
                <span class="task-deadline">${new Date(task.deadline).toLocaleDateString()}</span>
                <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${task.id}" data-type="task">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${task.id}" data-type="task">Delete</button>
            </div>
        `;

        return taskDiv;
    }

    // Update projects list
    updateProjectsList(projects) {
        const projectsContainer = document.querySelector('.projects-list');
        if (!projectsContainer) return;

        projectsContainer.innerHTML = '';
        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            projectsContainer.appendChild(projectElement);
        });
    }

    // Create project element
    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.setAttribute('data-project-id', project.id);
        
        projectDiv.innerHTML = `
            <div class="project-header">
                <h4>${project.name}</h4>
                <span class="project-status ${project.status.toLowerCase()}">${project.status}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-meta">
                <span class="project-manager">${project.manager}</span>
                <span class="project-deadline">${new Date(project.deadline).toLocaleDateString()}</span>
                <span class="project-progress">${project.progress}%</span>
            </div>
            <div class="project-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${project.id}" data-type="project">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${project.id}" data-type="project">Delete</button>
            </div>
        `;

        return projectDiv;
    }

    // Update users list (admin only)
    updateUsersList(users) {
        const usersContainer = document.querySelector('.users-list');
        if (!usersContainer) return;

        usersContainer.innerHTML = '';
        users.forEach(user => {
            const userElement = this.createUserElement(user);
            usersContainer.appendChild(userElement);
        });
    }

    // Create user element
    createUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.setAttribute('data-user-id', user.id);
        
        userDiv.innerHTML = `
            <div class="user-header">
                <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.name}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <span class="user-role">${user.role}</span>
                </div>
            </div>
            <div class="user-meta">
                <span class="user-email">${user.email}</span>
                <span class="user-status ${user.status.toLowerCase()}">${user.status}</span>
            </div>
            <div class="user-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${user.id}" data-type="user">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${user.id}" data-type="user">Delete</button>
            </div>
        `;

        return userDiv;
    }

    // Update notifications list
    updateNotificationsList(notifications) {
        const notificationsContainer = document.querySelector('.notifications-list');
        if (!notificationsContainer) return;

        notificationsContainer.innerHTML = '';
        notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            notificationsContainer.appendChild(notificationElement);
        });
    }

    // Create notification element
    createNotificationElement(notification) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        notificationDiv.setAttribute('data-notification-id', notification.id);
        
        notificationDiv.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h5>${notification.title}</h5>
                <p>${notification.message}</p>
                <span class="notification-time">${new Date(notification.createdAt).toLocaleString()}</span>
            </div>
            <div class="notification-actions">
                <button class="btn btn-sm btn-secondary mark-read" data-id="${notification.id}">Mark Read</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${notification.id}" data-type="notification">Delete</button>
            </div>
        `;

        return notificationDiv;
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const icons = {
            'task': 'fa-tasks',
            'project': 'fa-project-diagram',
            'message': 'fa-envelope',
            'reminder': 'fa-bell',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    // Update calendar events
    updateCalendarEvents(events) {
        const calendarContainer = document.querySelector('.calendar-events');
        if (!calendarContainer) return;

        calendarContainer.innerHTML = '';
        events.forEach(event => {
            const eventElement = this.createCalendarEventElement(event);
            calendarContainer.appendChild(eventElement);
        });
    }

    // Create calendar event element
    createCalendarEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        eventDiv.setAttribute('data-event-id', event.id);
        
        eventDiv.innerHTML = `
            <div class="event-header">
                <h5>${event.title}</h5>
                <span class="event-time">${new Date(event.startTime).toLocaleTimeString()}</span>
            </div>
            <p class="event-description">${event.description}</p>
            <div class="event-meta">
                <span class="event-type">${event.type}</span>
                <span class="event-location">${event.location}</span>
            </div>
        `;

        return eventDiv;
    }

    // Update time tracking data
    updateTimeTrackingData(timeData) {
        const timeContainer = document.querySelector('.time-tracking-data');
        if (!timeContainer) return;

        timeContainer.innerHTML = '';
        
        // Create time tracking summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'time-summary';
        summaryDiv.innerHTML = `
            <h4>Time Summary</h4>
            <div class="time-stats">
                <div class="time-stat">
                    <span class="time-label">Today:</span>
                    <span class="time-value">${timeData.todayHours || 0}h</span>
                </div>
                <div class="time-stat">
                    <span class="time-label">This Week:</span>
                    <span class="time-value">${timeData.weekHours || 0}h</span>
                </div>
                <div class="time-stat">
                    <span class="time-label">This Month:</span>
                    <span class="time-value">${timeData.monthHours || 0}h</span>
                </div>
            </div>
        `;
        timeContainer.appendChild(summaryDiv);

        // Create time entries list
        if (timeData.entries && timeData.entries.length > 0) {
            const entriesDiv = document.createElement('div');
            entriesDiv.className = 'time-entries';
            entriesDiv.innerHTML = '<h4>Recent Time Entries</h4>';
            
            timeData.entries.forEach(entry => {
                const entryElement = this.createTimeEntryElement(entry);
                entriesDiv.appendChild(entryElement);
            });
            
            timeContainer.appendChild(entriesDiv);
        }
    }

    // Create time entry element
    createTimeEntryElement(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'time-entry';
        entryDiv.setAttribute('data-entry-id', entry.id);
        
        entryDiv.innerHTML = `
            <div class="entry-header">
                <h5>${entry.taskName}</h5>
                <span class="entry-duration">${entry.duration}h</span>
            </div>
            <p class="entry-description">${entry.description}</p>
            <div class="entry-meta">
                <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                <span class="entry-project">${entry.projectName}</span>
            </div>
        `;

        return entryDiv;
    }

    // Update collaboration data
    updateCollaborationData(collaborationData) {
        const collaborationContainer = document.querySelector('.collaboration-data');
        if (!collaborationContainer) return;

        collaborationContainer.innerHTML = '';
        
        // Create team members list
        if (collaborationData.teamMembers) {
            const teamDiv = document.createElement('div');
            teamDiv.className = 'team-members';
            teamDiv.innerHTML = '<h4>Team Members</h4>';
            
            collaborationData.teamMembers.forEach(member => {
                const memberElement = this.createTeamMemberElement(member);
                teamDiv.appendChild(memberElement);
            });
            
            collaborationContainer.appendChild(teamDiv);
        }

        // Create recent messages list
        if (collaborationData.messages) {
            const messagesDiv = document.createElement('div');
            messagesDiv.className = 'recent-messages';
            messagesDiv.innerHTML = '<h4>Recent Messages</h4>';
            
            collaborationData.messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                messagesDiv.appendChild(messageElement);
            });
            
            collaborationContainer.appendChild(messagesDiv);
        }
    }

    // Create team member element
    createTeamMemberElement(member) {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';
        memberDiv.setAttribute('data-member-id', member.id);
        
        memberDiv.innerHTML = `
            <div class="member-header">
                <img src="${member.avatar || '/images/default-avatar.png'}" alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <h5>${member.name}</h5>
                    <span class="member-role">${member.role}</span>
                </div>
            </div>
            <div class="member-status">
                <span class="status-indicator ${member.status.toLowerCase()}"></span>
                <span class="status-text">${member.status}</span>
            </div>
        `;

        return memberDiv;
    }

    // Create message element
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        messageDiv.setAttribute('data-message-id', message.id);
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <p class="message-content">${message.content}</p>
        `;

        return messageDiv;
    }

    // Navigate to page
    navigateToPage(href) {
        window.location.href = href;
    }

    // Open edit modal
    openEditModal(type, id) {
        const modal = document.getElementById(`edit-${type}-modal`);
        if (modal) {
            // Load item data for editing
            this.loadItemForEdit(type, id);
            modal.classList.add('active');
        }
    }

    // Open delete modal
    openDeleteModal(type, id) {
        const modal = document.getElementById('delete-confirmation-modal');
        if (modal) {
            const confirmBtn = modal.querySelector('#confirm-delete');
            confirmBtn.onclick = () => this.deleteItem(type, id);
            modal.classList.add('active');
        }
    }

    // Load item for editing
    async loadItemForEdit(type, id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${type}/${id}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const item = await response.json();
                this.populateEditForm(type, item);
            }
        } catch (error) {
            console.error(`Error loading ${type} for edit:`, error);
        }
    }

    // Populate edit form
    populateEditForm(type, item) {
        const form = document.getElementById(`edit-${type}-form`);
        if (!form) return;

        // Clear previous values
        form.reset();

        // Populate form fields
        Object.keys(item).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = item[key];
            }
        });

        // Set form action
        form.setAttribute('data-item-id', item.id);
    }

    // Submit create task
    async submitCreateTask() {
        const form = document.getElementById('create-task-form');
        const formData = new FormData(form);
        const taskData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Task created successfully!');
                form.closest('.modal').classList.remove('active');
                this.loadTasksData(); // Reload tasks list
            } else {
                alert('Error creating task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task');
        }
    }

    // Submit edit task
    async submitEditTask() {
        const form = document.getElementById('edit-task-form');
        const taskId = form.getAttribute('data-item-id');
        const formData = new FormData(form);
        const taskData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Task updated successfully!');
                form.closest('.modal').classList.remove('active');
                this.loadTasksData(); // Reload tasks list
            } else {
                alert('Error updating task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task');
        }
    }

    // Submit create project
    async submitCreateProject() {
        const form = document.getElementById('create-project-form');
        const formData = new FormData(form);
        const projectData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Project created successfully!');
                form.closest('.modal').classList.remove('active');
                this.loadProjectsData(); // Reload projects list
            } else {
                alert('Error creating project');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Error creating project');
        }
    }

    // Delete item
    async deleteItem(type, id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${type}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
                document.getElementById('delete-confirmation-modal').classList.remove('active');
                
                // Reload appropriate data
                switch (type) {
                    case 'task':
                        this.loadTasksData();
                        break;
                    case 'project':
                        this.loadProjectsData();
                        break;
                    case 'user':
                        this.loadUsersData();
                        break;
                    case 'notification':
                        this.loadNotificationsData();
                        break;
                }
            } else {
                alert(`Error deleting ${type}`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error deleting ${type}`);
        }
    }

    // Update charts
    updateCharts(chartData) {
        // This would integrate with a charting library like Chart.js
        // For now, we'll just log the data
        console.log('Chart data:', chartData);
    }
}

// Initialize the dashboard data manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DashboardDataManager();
}); 