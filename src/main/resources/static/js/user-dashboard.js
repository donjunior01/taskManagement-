// ===========================
// USER DASHBOARD SPECIFIC JS
// ===========================

let userTaskStatusChart, userWeeklyProgressChart;
let userCalendar;

// Initialize User-specific charts
function initializeUserCharts() {
    // Task Status Chart
    const taskStatusCtx = document.getElementById('userTaskStatusChart');
    if (taskStatusCtx) {
        userTaskStatusChart = new Chart(taskStatusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Completed'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#6c757d', '#4361ee', '#2a9d8f'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa',
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Weekly Progress Chart
    const weeklyCtx = document.getElementById('userWeeklyProgressChart');
    if (weeklyCtx) {
        userWeeklyProgressChart = new Chart(weeklyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#2a9d8f',
                    borderRadius: 4
                }, {
                    label: 'Hours Logged',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#4361ee',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd' }
                    }
                }
            }
        });
    }

    // Load chart data
    loadUserChartData();
}

// Load chart data for user
async function loadUserChartData() {
    const userId = window.currentUser?.id;
    if (!userId) return;

    try {
        // Use the my-tasks endpoint or user-specific endpoint
        let tasks = [];
        
        try {
            const myTasksResponse = await apiRequest('/api/tasks/my-tasks?size=100');
            if (myTasksResponse.success && myTasksResponse.data) {
                tasks = myTasksResponse.data.content || myTasksResponse.data;
            }
        } catch (e) {
            // Fallback to user/{userId} endpoint
            const userTasksResponse = await apiRequest(`/api/tasks/user/${userId}?size=100`);
            if (userTasksResponse.success && userTasksResponse.data) {
                tasks = userTasksResponse.data.content || userTasksResponse.data;
            }
        }

        // Task Status Distribution
        const statusCounts = { 'TODO': 0, 'IN_PROGRESS': 0, 'COMPLETED': 0, 'REVIEW': 0, 'OVERDUE': 0 };

        tasks.forEach(task => {
            if (statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });

        // Update Task Status Chart
        if (userTaskStatusChart) {
            userTaskStatusChart.data.labels = ['To Do', 'In Progress', 'In Review', 'Completed', 'Overdue'];
            userTaskStatusChart.data.datasets[0].data = [
                statusCounts['TODO'], 
                statusCounts['IN_PROGRESS'], 
                statusCounts['REVIEW'],
                statusCounts['COMPLETED'],
                statusCounts['OVERDUE']
            ];
            userTaskStatusChart.data.datasets[0].backgroundColor = ['#6c757d', '#4361ee', '#f4a261', '#2a9d8f', '#e63946'];
            userTaskStatusChart.update();
        }

        // Update upcoming tasks
        loadUserUpcomingTasks(tasks);

        // Update stats
        updateUserStats(tasks);

    } catch (error) {
        console.error('Error loading user chart data:', error);
        // Load from dashboard stats if available
        if (window.dashboardStats) {
            const stats = window.dashboardStats;
            if (userTaskStatusChart) {
                userTaskStatusChart.data.datasets[0].data = [
                    stats.activeTasks - stats.completedTasks || 0, 
                    stats.activeTasks || 0, 
                    0,
                    stats.completedTasks || 0,
                    stats.overdueTasks || 0
                ];
                userTaskStatusChart.update();
            }
        }
    }
}

// Update user stats display
function updateUserStats(tasks) {
    const todoCount = tasks.filter(t => t.status === 'TODO').length;
    const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdueCount = tasks.filter(t => t.status === 'OVERDUE').length;
    
    // Update stat cards if they exist
    const activeStat = document.getElementById('user-active-tasks');
    const completedStat = document.getElementById('user-completed-tasks');
    const overdueStat = document.getElementById('user-overdue-tasks');
    
    if (activeStat) activeStat.textContent = todoCount + inProgressCount;
    if (completedStat) completedStat.textContent = completedCount;
    if (overdueStat) overdueStat.textContent = overdueCount;
}

// Load upcoming tasks for user
function loadUserUpcomingTasks(tasks) {
    const tbody = document.getElementById('user-upcoming-tasks-body');
    if (!tbody) return;

    const upcomingTasks = tasks
        .filter(t => t.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
    
    if (upcomingTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No upcoming tasks</td></tr>';
        return;
    }

    tbody.innerHTML = upcomingTasks.map(task => `
        <tr>
            <td>${escapeHtml(task.name)}</td>
            <td>${task.projectName || 'No Project'}</td>
            <td><span class="priority-badge ${task.priority?.toLowerCase()}">${task.priority}</span></td>
            <td>${formatDate(task.deadline)}</td>
            <td><span class="status-badge ${task.status?.toLowerCase().replace('_', '-')}">${formatStatus(task.status)}</span></td>
        </tr>
    `).join('');
}

// Initialize User Calendar
function initializeUserCalendar() {
    const calendarEl = document.getElementById('user-calendar');
    if (!calendarEl || userCalendar) return;

    userCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        height: 'auto',
        editable: false,
        selectable: true,
        eventClick: function(info) {
            showToast(`Event: ${info.event.title}`, 'info');
        },
        select: function(info) {
            document.getElementById('event-start').value = info.startStr + 'T09:00';
            document.getElementById('event-end').value = info.endStr + 'T17:00';
            openModal('create-event-modal');
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            apiRequest(`/api/calendar/range?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`)
                .then(data => {
                    if (data.success) {
                        const events = data.data.map(event => ({
                            id: event.id,
                            title: event.title,
                            start: event.startTime,
                            end: event.endTime,
                            allDay: event.allDay,
                            backgroundColor: event.color,
                            borderColor: event.color,
                            extendedProps: {
                                description: event.description,
                                eventType: event.eventType
                            }
                        }));
                        successCallback(events);
                    } else {
                        successCallback([]);
                    }
                })
                .catch(error => {
                    console.error('Error loading calendar events:', error);
                    successCallback([]);
                });
        }
    });
    userCalendar.render();

    // Load upcoming events
    loadUserUpcomingEvents();
}

// Load upcoming events for user
async function loadUserUpcomingEvents() {
    const container = document.getElementById('user-upcoming-events');
    if (!container) return;

    try {
        const response = await apiRequest('/api/calendar/upcoming');
        const events = response.data || [];

        if (events.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                    <i class="fas fa-calendar-day" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No upcoming deadlines</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.slice(0, 5).map(event => `
            <div style="padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid ${event.color || '#4361ee'};">
                <strong>${escapeHtml(event.title)}</strong>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
                    <i class="fas fa-clock"></i> ${formatDate(event.startTime)}
                </p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}

// Format status for display
function formatStatus(status) {
    const statusMap = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'In Review',
        'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
}

// Load user tasks for tasks page
async function loadUserTasks() {
    const tbody = document.getElementById('tasks-table-body');
    if (!tbody) return;

    const userId = window.currentUser?.id;
    
    try {
        const response = await apiRequest('/api/tasks?size=100');
        const allTasks = response.data || [];
        const tasks = allTasks.filter(t => t.assignedToId === userId);

        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No tasks assigned to you</td></tr>';
            return;
        }

        tbody.innerHTML = tasks.map(task => `
            <tr>
                <td><strong>${escapeHtml(task.name)}</strong></td>
                <td>${task.projectName || 'No Project'}</td>
                <td><span class="priority-badge ${task.priority?.toLowerCase()}">${task.priority}</span></td>
                <td>${formatDate(task.deadline)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 8px; background: rgba(67, 97, 238, 0.2); border-radius: 4px;">
                            <div style="width: ${task.progress || 0}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                        </div>
                        <span>${task.progress || 0}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${task.status?.toLowerCase().replace('_', '-')}">${formatStatus(task.status)}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 10px;" onclick="editUserTask(${task.id}, '${escapeHtml(task.name)}', ${task.progress || 0}, '${task.status}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-primary" style="padding: 6px 10px;" onclick="submitDeliverable(${task.id}, '${escapeHtml(task.name)}')">
                        <i class="fas fa-upload"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading user tasks:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading tasks</td></tr>';
    }
}

// Edit user task (update progress)
function editUserTask(id, name, progress, status) {
    document.getElementById('edit-task-id').value = id;
    document.getElementById('edit-task-name').value = name;
    document.getElementById('edit-task-progress').value = progress;
    document.getElementById('progress-value').textContent = progress + '%';
    document.getElementById('edit-task-status').value = status;
    openModal('edit-task-modal');
}

// Submit deliverable shortcut
function submitDeliverable(taskId, taskName) {
    const select = document.getElementById('deliverable-task-select');
    if (select) {
        // Load tasks if not loaded
        loadTaskSelectOptions(select, taskId);
    }
    openModal('submit-deliverable-modal');
}

// Load task options for select
async function loadTaskSelectOptions(selectElement, selectedId = null) {
    const userId = window.currentUser?.id;
    
    try {
        const response = await apiRequest('/api/tasks?size=100');
        const allTasks = response.data || [];
        const tasks = allTasks.filter(t => t.assignedToId === userId && t.status !== 'COMPLETED');

        selectElement.innerHTML = '<option value="">Select Task</option>';
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            if (selectedId && task.id === selectedId) option.selected = true;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading task options:', error);
    }
}

// Load user deliverables
async function loadUserDeliverables() {
    const tbody = document.getElementById('user-deliverables-body');
    if (!tbody) return;

    try {
        const response = await apiRequest('/api/deliverables/my');
        const deliverables = response.data || [];

        if (deliverables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No deliverables submitted yet</td></tr>';
            return;
        }

        tbody.innerHTML = deliverables.map(d => `
            <tr>
                <td>${d.taskName || 'N/A'}</td>
                <td><a href="#" style="color: var(--primary);"><i class="fas fa-file"></i> ${d.fileName || 'File'}</a></td>
                <td><span class="status-badge ${d.status?.toLowerCase()}">${d.status}</span></td>
                <td>${formatDate(d.submittedAt)}</td>
                <td>${d.feedback || '-'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading deliverables:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading deliverables</td></tr>';
    }
}

// Load time logs
async function loadTimeLogs() {
    const tbody = document.getElementById('time-logs-body');
    if (!tbody) return;

    try {
        const response = await apiRequest('/api/time-logs/my');
        const logs = response.data || [];

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No time logs recorded yet</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${log.taskName || 'N/A'}</td>
                <td>${log.hours}h</td>
                <td>${formatDate(log.date)}</td>
                <td>${log.description || '-'}</td>
            </tr>
        `).join('');

        // Update time summary
        updateTimeSummary(logs);
    } catch (error) {
        console.error('Error loading time logs:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error loading time logs</td></tr>';
    }
}

// Update time summary
function updateTimeSummary(logs) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let todayHours = 0, weekHours = 0, monthHours = 0;

    logs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= today) todayHours += log.hours;
        if (logDate >= weekStart) weekHours += log.hours;
        if (logDate >= monthStart) monthHours += log.hours;
    });

    const todayEl = document.getElementById('today-hours');
    const weekEl = document.getElementById('week-hours');
    const monthEl = document.getElementById('month-hours');

    if (todayEl) todayEl.textContent = todayHours + 'h';
    if (weekEl) weekEl.textContent = weekHours + 'h';
    if (monthEl) monthEl.textContent = monthHours + 'h';
}

// Load user conversations for messages
async function loadUserConversations() {
    const container = document.getElementById('user-conversations-list');
    if (!container) return;

    try {
        const response = await apiRequest('/api/messages/conversations');
        const conversations = response.data || [];

        if (conversations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                    <p>No conversations yet</p>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="openModal('compose-message-modal')">
                        <i class="fas fa-plus"></i> Start New Conversation
                    </button>
                </div>
            `;
            return;
        }

        const currentUserId = window.currentUser?.id;
        
        container.innerHTML = conversations.map(conv => {
            // Determine the other person in the conversation
            const otherPersonId = conv.senderId === currentUserId ? conv.recipientId : conv.senderId;
            const otherPersonName = conv.senderId === currentUserId ? conv.recipientName : conv.senderName;
            const isUnread = !conv.isRead && conv.recipientId === currentUserId;
            
            return `
            <div class="conversation-item ${isUnread ? 'unread' : ''}" onclick="openConversation(${otherPersonId}, 'user')" 
                 style="padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; ${isUnread ? 'border-left: 3px solid var(--primary);' : ''}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                        ${(otherPersonName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <strong>${escapeHtml(otherPersonName) || 'Unknown User'}</strong>
                        ${isUnread ? '<span class="message-unread-badge" style="margin-left: 8px;">New</span>' : ''}
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(conv.content) || 'No messages'}
                        </p>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${timeAgo(conv.createdAt)}</span>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading conversations:', error);
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                <p>Unable to load conversations</p>
            </div>
        `;
    }
}

// Load compose recipients
async function loadComposeRecipients() {
    const select = document.getElementById('compose-recipient');
    if (!select) return;

    try {
        const response = await apiRequest('/api/users?size=100');
        const users = response.data || [];

        select.innerHTML = '<option value="">Select recipient...</option>';
        users.filter(u => u.id !== window.currentUser?.id).forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading recipients:', error);
    }
}

// Open conversation
function openConversation(id, type) {
    document.getElementById('message-header').style.display = 'block';
    document.getElementById('no-conversation-selected').style.display = 'none';
    document.getElementById('messages-list').style.display = 'flex';
    document.getElementById('message-input-area').style.display = 'block';
    document.getElementById('message-recipient-id').value = id;

    // Load messages for this conversation
    loadConversationMessages(id, type);
}

// Load conversation messages
async function loadConversationMessages(id, type) {
    const container = document.getElementById('messages-list');
    if (!container) return;

    try {
        const response = await apiRequest(`/api/messages/conversation/${id}`);
        const messages = response.data || [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isMe = msg.senderId === window.currentUser?.id;
            return `
                <div style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'};">
                    <div style="max-width: 70%; padding: 12px 16px; border-radius: 12px; background: ${isMe ? 'var(--primary)' : 'var(--bg)'}; color: ${isMe ? 'white' : 'var(--text)'};">
                        ${!isMe ? `<strong style="display: block; margin-bottom: 4px; font-size: 0.85rem;">${msg.senderName}</strong>` : ''}
                        <p style="margin: 0;">${escapeHtml(msg.content)}</p>
                        <span style="display: block; margin-top: 4px; font-size: 0.75rem; opacity: 0.7;">${formatDate(msg.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Search messages
function searchMessages(query) {
    // Implement message search
    console.log('Searching messages:', query);
}

// Attach file (placeholder)
function attachFile() {
    showToast('File attachment feature coming soon!', 'info');
}

// User-specific page data loading
function loadUserPageData(pageId) {
    if (pageId === 'dashboard' && document.getElementById('userTaskStatusChart')) {
        initializeUserCharts();
    }
    if (pageId === 'calendar' && !userCalendar) {
        setTimeout(initializeUserCalendar, 100);
    }
    if (pageId === 'tasks') {
        loadUserTasks();
    }
    if (pageId === 'deliverables') {
        loadUserDeliverables();
        loadTaskSelectOptions(document.getElementById('deliverable-task-select'));
    }
    if (pageId === 'time-tracking') {
        loadTimeLogs();
        loadTaskSelectOptions(document.getElementById('time-task'));
    }
    if (pageId === 'messages') {
        loadUserConversations();
        loadComposeRecipients();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Override loadPageData after DOM is ready
    if (typeof window.loadPageData === 'function') {
        const originalLoadPageData = window.loadPageData;
        window.loadPageData = function(pageId) {
            originalLoadPageData(pageId);
            loadUserPageData(pageId);
        };
    }
    
    // Initialize charts on dashboard
    if (document.getElementById('userTaskStatusChart')) {
        initializeUserCharts();
    }
});

// Handle forms
document.addEventListener('DOMContentLoaded', () => {
    // Edit task form (user updates progress)
    const editTaskForm = document.getElementById('edit-task-form');
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskId = document.getElementById('edit-task-id').value;
            const progress = parseInt(document.getElementById('edit-task-progress').value);
            const status = document.getElementById('edit-task-status').value;

            try {
                await apiRequest(`/api/tasks/${taskId}/progress`, 'PATCH', { progress, status });
                showToast('Task updated successfully!', 'success');
                closeModal('edit-task-modal');
                loadUserTasks();
                loadUserChartData();
            } catch (error) {
                showToast('Error updating task', 'error');
            }
        });
    }

    // Compose message form
    const composeForm = document.getElementById('compose-message-form');
    if (composeForm) {
        composeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipientId = document.getElementById('compose-recipient').value;
            const content = document.getElementById('compose-message').value;

            try {
                await apiRequest('/api/messages', 'POST', { recipientId: parseInt(recipientId), content });
                showToast('Message sent successfully!', 'success');
                closeModal('compose-message-modal');
                composeForm.reset();
                loadUserConversations();
            } catch (error) {
                showToast('Error sending message', 'error');
            }
        });
    }

    // Send message form
    const sendForm = document.getElementById('send-message-form');
    if (sendForm) {
        sendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipientId = document.getElementById('message-recipient-id').value;
            const content = document.getElementById('message-input').value;

            if (!content.trim()) return;

            try {
                await apiRequest('/api/messages', 'POST', { recipientId: parseInt(recipientId), content });
                document.getElementById('message-input').value = '';
                loadConversationMessages(recipientId, 'user');
            } catch (error) {
                showToast('Error sending message', 'error');
            }
        });
    }

    // Log time form
    const logTimeForm = document.getElementById('log-time-form');
    if (logTimeForm) {
        logTimeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(logTimeForm);

            try {
                await apiRequest('/api/time-logs', 'POST', {
                    taskId: parseInt(formData.get('taskId')),
                    hours: parseFloat(formData.get('hours')),
                    logDate: formData.get('date'),
                    description: formData.get('description')
                });
                showToast('Time logged successfully!', 'success');
                closeModal('log-time-modal');
                logTimeForm.reset();
                loadTimeLogs();
            } catch (error) {
                showToast('Error logging time', 'error');
            }
        });
    }

    // Submit deliverable form with file upload
    const deliverableForm = document.getElementById('submit-deliverable-form');
    if (deliverableForm) {
        deliverableForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(deliverableForm);
            const fileInput = document.getElementById('deliverable-file');
            const file = fileInput?.files[0];

            try {
                let fileUrl = formData.get('filePath') || '';
                let fileName = '';
                let fileSize = 0;

                // Upload file if provided
                if (file) {
                    // Validate file size (10MB max)
                    if (file.size > 10 * 1024 * 1024) {
                        showToast('File size exceeds 10MB limit', 'error');
                        return;
                    }

                    showToast('Uploading file...', 'info');
                    
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    const uploadResponse = await fetch('/api/files/upload', {
                        method: 'POST',
                        credentials: 'include',
                        body: uploadFormData
                    });

                    const uploadData = await uploadResponse.json();

                    if (!uploadData.success) {
                        showToast(uploadData.message || 'Failed to upload file', 'error');
                        return;
                    }

                    fileUrl = uploadData.data.fileUrl;
                    fileName = uploadData.data.fileName;
                    fileSize = uploadData.data.fileSize;
                } else {
                    fileName = formData.get('fileName') || 'Deliverable';
                }

                // Create deliverable record
                await apiRequest('/api/deliverables', 'POST', {
                    taskId: parseInt(formData.get('taskId')),
                    fileName: fileName,
                    fileUrl: fileUrl,
                    fileSize: fileSize
                });
                showToast('Deliverable submitted successfully!', 'success');
                closeModal('submit-deliverable-modal');
                deliverableForm.reset();
                loadUserDeliverables();
            } catch (error) {
                showToast('Error submitting deliverable', 'error');
            }
        });
    }

    // Create event form
    const eventForm = document.getElementById('create-event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(eventForm);

            try {
                await apiRequest('/api/calendar', 'POST', {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    startTime: formData.get('startTime'),
                    endTime: formData.get('endTime'),
                    color: formData.get('color'),
                    eventType: 'CUSTOM'
                });
                showToast('Event created successfully!', 'success');
                closeModal('create-event-modal');
                eventForm.reset();
                if (userCalendar) userCalendar.refetchEvents();
                loadUserUpcomingEvents();
            } catch (error) {
                showToast('Error creating event', 'error');
            }
        });
    }

    // Edit profile form
    const profileForm = document.getElementById('edit-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);

            try {
                await apiRequest(`/api/users/${window.currentUser.id}/profile`, 'PUT', {
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email')
                });
                showToast('Profile updated successfully!', 'success');
                closeModal('edit-profile-modal');
                // Optionally reload page to show updated info
                // window.location.reload();
            } catch (error) {
                showToast('Error updating profile', 'error');
            }
        });
    }

    // Change password form
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(passwordForm);

            if (formData.get('newPassword') !== formData.get('confirmPassword')) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            try {
                await apiRequest('/api/users/change-password', 'POST', {
                    currentPassword: formData.get('currentPassword'),
                    newPassword: formData.get('newPassword')
                });
                showToast('Password changed successfully!', 'success');
                closeModal('change-password-modal');
                passwordForm.reset();
            } catch (error) {
                showToast('Error changing password', 'error');
            }
        });
    }
    
    // Override openModal to load task options for specific modals
    const originalOpenModal = window.openModal;
    window.openModal = function(modalId) {
        // Call original openModal
        if (originalOpenModal) originalOpenModal(modalId);
        
        // Load task options for specific modals
        if (modalId === 'submit-deliverable-modal') {
            loadTaskSelectOptions(document.getElementById('deliverable-task-select'));
        } else if (modalId === 'log-time-modal') {
            loadTaskSelectOptions(document.getElementById('time-task'));
            // Set today's date as default
            const dateInput = document.getElementById('time-date');
            if (dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    };
    
    // Load recipients for compose message modal
    async function loadComposeRecipients() {
        const select = document.getElementById('compose-recipient');
        if (!select) return;
        
        try {
            const response = await apiRequest('/api/users?size=100');
            const users = response.data || [];
            
            select.innerHTML = '<option value="">Select Recipient</option>';
            users.filter(u => u.id !== window.currentUser?.id).forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading recipients:', error);
        }
    }
    
    // Call loadComposeRecipients when compose modal opens
    const composeRecipientSelect = document.getElementById('compose-recipient');
    if (composeRecipientSelect && !composeRecipientSelect.options.length > 1) {
        loadComposeRecipients();
    }
});

