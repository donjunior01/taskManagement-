// Calendar functionality for Project Calendar page
let calendar = null;
let currentViewEventId = null;
let currentEditEvent = null;

// Event type colors
const eventTypeColors = {
    'PROJECT_START': '#4361ee',
    'PROJECT_END': '#2a9d8f',
    'PROJECT_MILESTONE': '#3498db',
    'TASK_DEADLINE': '#e63946',
    'TASK_REMINDER': '#e74c3c',
    'DELIVERABLE_DUE': '#f4a261',
    'MEETING': '#9b59b6',
    'REVIEW': '#3498db',
    'CUSTOM': '#6c757d'
};

// Initialize calendar when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar when navigating to calendar page
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'calendar') {
                setTimeout(initializeCalendar, 100);
            }
        });
    });
    
    // Setup event form submission
    const createEventForm = document.getElementById('create-event-form');
    if (createEventForm) {
        createEventForm.addEventListener('submit', handleCreateEvent);
    }
});

// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar-view');
    
    if (!calendarEl) return;
    
    // Destroy existing calendar if it exists
    if (calendar) {
        calendar.destroy();
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
        },
        navLinks: true,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        nowIndicator: true,
        
        // Load events from API
        events: function(info, successCallback, failureCallback) {
            loadCalendarEvents(info.startStr, info.endStr, successCallback, failureCallback);
        },
        
        // Handle date selection for creating new events
        select: function(info) {
            const startInput = document.getElementById('event-start');
            const endInput = document.getElementById('event-end');
            
            if (startInput && endInput) {
                startInput.value = formatDateTimeForInput(info.start);
                endInput.value = formatDateTimeForInput(info.end);
            }
            
            openModal('create-event-modal');
        },
        
        // Handle event click to view details
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        
        // Handle event drag/drop
        eventDrop: function(info) {
            updateEventDates(info.event);
        },
        
        // Handle event resize
        eventResize: function(info) {
            updateEventDates(info.event);
        },
        
        // Custom event rendering
        eventDidMount: function(info) {
            // Add tooltip
            info.el.setAttribute('title', info.event.title);
        },
        
        // Loading indicator
        loading: function(isLoading) {
            if (isLoading) {
                calendarEl.style.opacity = '0.5';
            } else {
                calendarEl.style.opacity = '1';
            }
        }
    });
    
    calendar.render();
    loadUpcomingEvents();
}

// Load calendar events from API (including tasks)
async function loadCalendarEvents(start, end, successCallback, failureCallback) {
    try {
        // Load both calendar events and tasks
        const [calendarResponse, tasksResponse] = await Promise.all([
            fetch(`/api/calendar/range?start=${start}&end=${end}`, {
                method: 'GET',
                credentials: 'include'
            }).catch(() => ({ ok: false })),
            fetch(`/api/tasks?page=0&size=100`, {
                method: 'GET',
                credentials: 'include'
            }).catch(() => ({ ok: false }))
        ]);
        
        let allEvents = [];
        
        // Process calendar events
        if (calendarResponse.ok) {
            const data = await calendarResponse.json();
            if (data.success && data.data) {
                const calendarEvents = data.data.map(event => ({
                    id: 'event-' + event.id,
                    title: event.title,
                    start: event.start || event.startTime,
                    end: event.end || event.endTime,
                    allDay: event.allDay || false,
                    backgroundColor: event.color || eventTypeColors[event.eventType] || '#6c757d',
                    borderColor: event.color || eventTypeColors[event.eventType] || '#6c757d',
                    extendedProps: {
                        type: 'event',
                        description: event.description,
                        eventType: event.eventType,
                        entityId: event.entityId,
                        entityType: event.entityType,
                        location: event.location,
                        isSynced: event.isSynced,
                        googleEventId: event.googleEventId
                    }
                }));
                allEvents = [...allEvents, ...calendarEvents];
            }
        }
        
        // Process tasks as calendar events
        if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            if (tasksData.success && tasksData.data) {
                const tasks = tasksData.data.content || tasksData.data;
                const taskEvents = tasks
                    .filter(task => task.deadline) // Only show tasks with deadlines
                    .map(task => ({
                        id: 'task-' + task.id,
                        title: '📋 ' + task.name,
                        start: task.deadline,
                        allDay: true,
                        backgroundColor: getTaskStatusColor(task.status),
                        borderColor: getTaskStatusColor(task.status),
                        extendedProps: {
                            type: 'task',
                            taskId: task.id,
                            description: task.description,
                            status: task.status,
                            priority: task.priority,
                            progress: task.progress,
                            assignedToName: task.assignedToName,
                            projectName: task.projectName
                        }
                    }));
                allEvents = [...allEvents, ...taskEvents];
            }
        }
        
        successCallback(allEvents);
    } catch (error) {
        console.error('Error loading calendar events:', error);
        failureCallback(error);
    }
}

// Get color based on task status
function getTaskStatusColor(status) {
    switch (status) {
        case 'TODO': return '#6c757d';
        case 'IN_PROGRESS': return '#4361ee';
        case 'REVIEW': return '#f4a261';
        case 'COMPLETED': return '#2a9d8f';
        case 'OVERDUE': return '#e63946';
        default: return '#6c757d';
    }
}

// Load upcoming events for the table
async function loadUpcomingEvents() {
    const tableBody = document.getElementById('upcoming-events-body');
    if (!tableBody) return;
    
    try {
        const response = await fetch('/api/calendar/upcoming', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            tableBody.innerHTML = data.data.slice(0, 10).map(event => `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="width: 8px; height: 8px; background: ${event.color || eventTypeColors[event.eventType]}; border-radius: 50%;"></span>
                            ${escapeHtml(event.title)}
                        </div>
                    </td>
                    <td><span class="badge badge-${getEventTypeBadgeClass(event.eventType)}">${formatEventType(event.eventType)}</span></td>
                    <td>${formatEventDate(event.startTime)}</td>
                    <td>${event.entityType ? `${event.entityType} #${event.entityId}` : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewEventById(${event.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEvent(${event.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary);">
                        <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>No upcoming events</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load events
                </td>
            </tr>
        `;
    }
}

// Handle create event form submission
async function handleCreateEvent(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        eventType: formData.get('eventType'),
        color: formData.get('color'),
        location: formData.get('location'),
        reminderMinutes: parseInt(formData.get('reminderMinutes')),
        allDay: form.querySelector('#event-all-day').checked,
        syncToGoogle: form.querySelector('#event-sync-google').checked
    };
    
    try {
        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Event created successfully!', 'success');
            closeModal('create-event-modal');
            form.reset();
            
            // Refresh calendar
            if (calendar) {
                calendar.refetchEvents();
            }
            loadUpcomingEvents();
        } else {
            showToast(data.message || 'Failed to create event', 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showToast('Failed to create event', 'error');
    }
}

// Show event details in modal
function showEventDetails(event) {
    currentViewEventId = event.id;
    
    // Check if this is a task or an event
    if (event.extendedProps.type === 'task') {
        showTaskDetails(event);
        return;
    }
    
    document.getElementById('view-event-title').textContent = event.title;
    
    // Format date
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : startDate;
    
    document.getElementById('view-event-date').textContent = 
        startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Format time
    if (event.allDay) {
        document.getElementById('view-event-time').textContent = 'All Day';
    } else {
        document.getElementById('view-event-time').textContent = 
            `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Location
    const locationContainer = document.getElementById('view-event-location-container');
    const locationEl = document.getElementById('view-event-location');
    if (locationContainer && event.extendedProps.location) {
        locationContainer.style.display = 'flex';
        locationEl.textContent = event.extendedProps.location;
    } else if (locationContainer) {
        locationContainer.style.display = 'none';
    }
    
    // Event type
    const typeEl = document.getElementById('view-event-type');
    if (typeEl) {
        typeEl.textContent = formatEventType(event.extendedProps.eventType);
        typeEl.className = `badge badge-${getEventTypeBadgeClass(event.extendedProps.eventType)}`;
    }
    
    // Description
    const descContainer = document.getElementById('view-event-description-container');
    const descEl = document.getElementById('view-event-description');
    if (descContainer) {
        if (event.extendedProps.description) {
            descContainer.style.display = 'block';
            descEl.textContent = event.extendedProps.description;
        } else {
            descContainer.style.display = 'none';
        }
    }
    
    // Google sync status
    const syncStatus = document.getElementById('view-event-google-sync');
    if (syncStatus) {
        if (event.extendedProps.isSynced) {
            syncStatus.textContent = 'Synced to Google Calendar';
            syncStatus.style.color = '#4285f4';
        } else {
            syncStatus.textContent = 'Not synced';
            syncStatus.style.color = 'var(--text-secondary)';
        }
    }
    
    openModal('view-event-modal');
}

// Show task details in a toast or dedicated modal
function showTaskDetails(event) {
    const props = event.extendedProps;
    const taskId = props.taskId;
    
    // Create a detailed toast or use existing task view
    const title = event.title.replace('📋 ', '');
    const statusBadge = `<span class="status-badge status-${(props.status || '').toLowerCase()}">${props.status || 'TODO'}</span>`;
    const priorityBadge = props.priority ? `<span class="priority-badge priority-${(props.priority || '').toLowerCase()}">${props.priority}</span>` : '';
    
    const details = `
        <div style="padding: 10px;">
            <h4 style="margin: 0 0 10px 0;">${escapeHtml(title)}</h4>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${statusBadge}</p>
            ${props.priority ? `<p style="margin: 5px 0;"><strong>Priority:</strong> ${priorityBadge}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Progress:</strong> ${props.progress || 0}%</p>
            ${props.assignedToName ? `<p style="margin: 5px 0;"><strong>Assigned to:</strong> ${escapeHtml(props.assignedToName)}</p>` : ''}
            ${props.projectName ? `<p style="margin: 5px 0;"><strong>Project:</strong> ${escapeHtml(props.projectName)}</p>` : ''}
            ${props.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${escapeHtml(props.description)}</p>` : ''}
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary btn-sm" onclick="editTask(${taskId}); closeAllToasts();">Edit Task</button>
                <button class="btn btn-secondary btn-sm" onclick="closeAllToasts();">Close</button>
            </div>
        </div>
    `;
    
    // Show in a toast notification that stays visible
    showPersistentToast(details, 'info');
}

// Show a persistent toast that doesn't auto-close
function showPersistentToast(content, type = 'info') {
    // Remove any existing persistent toasts
    closeAllToasts();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-persistent`;
    toast.innerHTML = content;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        min-width: 300px;
        max-width: 450px;
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'toast-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
    `;
    backdrop.onclick = closeAllToasts;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(toast);
}

function closeAllToasts() {
    document.querySelectorAll('.toast-persistent, .toast-backdrop').forEach(el => el.remove());
}

// View event by ID
async function viewEventById(id) {
    try {
        const response = await fetch(`/api/calendar/${id}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const event = {
                id: data.data.id,
                title: data.data.title,
                start: data.data.startTime,
                end: data.data.endTime,
                allDay: data.data.allDay,
                extendedProps: {
                    description: data.data.description,
                    eventType: data.data.eventType,
                    location: data.data.location,
                    isSynced: data.data.isSynced
                }
            };
            showEventDetails(event);
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        showToast('Failed to load event details', 'error');
    }
}

// Delete event
async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/calendar/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Event deleted successfully', 'success');
            
            // Refresh calendar
            if (calendar) {
                calendar.refetchEvents();
            }
            loadUpcomingEvents();
        } else {
            showToast(data.message || 'Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
    }
}

// Delete event from view modal
function deleteEventFromView() {
    if (currentViewEventId) {
        closeModal('view-event-modal');
        deleteEvent(currentViewEventId);
    }
}

// Edit event from view modal
async function editEventFromView() {
    if (!currentViewEventId) return;
    
    closeModal('view-event-modal');
    
    try {
        const response = await fetch(`/api/calendar/${currentViewEventId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            currentEditEvent = data.data;
            openEditEventModal(data.data);
        } else {
            showToast('Failed to load event for editing', 'error');
        }
    } catch (error) {
        console.error('Error loading event for edit:', error);
        showToast('Failed to load event for editing', 'error');
    }
}

// Open edit event modal with event data
function openEditEventModal(event) {
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-title').value = event.title || '';
    document.getElementById('edit-event-description').value = event.description || '';
    document.getElementById('edit-event-start').value = formatDateTimeForInput(event.startTime);
    document.getElementById('edit-event-end').value = formatDateTimeForInput(event.endTime);
    document.getElementById('edit-event-type').value = event.eventType || 'CUSTOM';
    document.getElementById('edit-event-color').value = event.color || '#4361ee';
    document.getElementById('edit-event-location').value = event.location || '';
    document.getElementById('edit-event-reminder').value = event.reminderMinutes || 30;
    document.getElementById('edit-event-all-day').checked = event.allDay || false;
    
    openModal('edit-event-modal');
}

// Handle edit event form submission
async function handleEditEvent(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const eventId = formData.get('id');
    
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        eventType: formData.get('eventType'),
        color: formData.get('color'),
        location: formData.get('location'),
        reminderMinutes: parseInt(formData.get('reminderMinutes')),
        allDay: form.querySelector('#edit-event-all-day').checked
    };
    
    try {
        const response = await fetch(`/api/calendar/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Event updated successfully!', 'success');
            closeModal('edit-event-modal');
            
            // Refresh calendar
            if (calendar) {
                calendar.refetchEvents();
            }
            loadUpcomingEvents();
        } else {
            showToast(data.message || 'Failed to update event', 'error');
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showToast('Failed to update event', 'error');
    }
}

// Setup edit form on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const editEventForm = document.getElementById('edit-event-form');
    if (editEventForm) {
        editEventForm.addEventListener('submit', handleEditEvent);
    }
});

// Update event dates after drag/drop or resize
async function updateEventDates(event) {
    const eventData = {
        title: event.title,
        startTime: event.start.toISOString(),
        endTime: event.end ? event.end.toISOString() : event.start.toISOString(),
        allDay: event.allDay
    };
    
    try {
        const response = await fetch(`/api/calendar/${event.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Event updated', 'success');
            loadUpcomingEvents();
        } else {
            showToast('Failed to update event', 'error');
            calendar.refetchEvents();
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showToast('Failed to update event', 'error');
        calendar.refetchEvents();
    }
}

// Sync with Google Calendar
async function syncGoogleCalendar() {
    showToast('Syncing with Google Calendar...', 'info');
    
    try {
        // Get current month range
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        
        const response = await fetch(`/api/calendar/google/events?start=${start.toISOString()}&end=${end.toISOString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Google Calendar synced successfully!', 'success');
            if (calendar) {
                calendar.refetchEvents();
            }
        } else {
            if (data.message && data.message.includes('not configured')) {
                showToast('Google Calendar is not configured. Please set up Google Calendar integration in settings.', 'warning');
            } else {
                showToast(data.message || 'Failed to sync with Google Calendar', 'error');
            }
        }
    } catch (error) {
        console.error('Error syncing with Google Calendar:', error);
        showToast('Failed to sync with Google Calendar', 'error');
    }
}

// Helper Functions
function formatDateTimeForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatEventDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === now.toDateString()) {
        return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatEventType(type) {
    if (!type) return 'Event';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getEventTypeBadgeClass(type) {
    switch (type) {
        case 'PROJECT_START':
        case 'PROJECT_END':
        case 'PROJECT_MILESTONE':
            return 'primary';
        case 'TASK_DEADLINE':
        case 'TASK_REMINDER':
            return 'danger';
        case 'DELIVERABLE_DUE':
            return 'warning';
        case 'MEETING':
        case 'REVIEW':
            return 'info';
        default:
            return 'secondary';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

