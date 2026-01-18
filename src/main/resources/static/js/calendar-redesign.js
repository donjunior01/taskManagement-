/**
 * Google Calendar-like Calendar Frontend
 * Handles all interactions with the calendar page including event management,
 * view switching, and sidebar functionality
 */

let calendar;
let currentView = 'month';
const eventColors = {
    'task': '#4361EE',
    'deadline': '#E63946',
    'meeting': '#9B59B6',
    'event': '#2A9D8F',
    'deliverable': '#F4A261',
    'review': '#3498DB'
};

/**
 * Initialize calendar on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    loadUpcomingEvents();
    generateMiniCalendar();
    loadTasksForDropdown();
    setupCheckboxListeners();
});

/**
 * Initialize FullCalendar
 */
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        plugins: ['daygrid', 'timegrid', 'interaction', 'list'],
        height: 'auto',
        contentHeight: 'auto',
        events: function(info, successCallback, failureCallback) {
            fetchCalendarEvents(successCallback, failureCallback);
        },
        eventClick: function(info) {
            showEventDetail(info.event);
        },
        select: function(info) {
            document.getElementById('event-start').value = info.start.toISOString().slice(0, 16);
            if (info.end) {
                document.getElementById('event-end').value = new Date(info.end - 1).toISOString().slice(0, 16);
            }
            openCreateEventModal();
        },
        selectable: true,
        editable: true,
        eventDrop: function(info) {
            updateEventTime(info.event);
        },
        eventResize: function(info) {
            updateEventTime(info.event);
        },
        datesSet: function() {
            calendar.refetchEvents();
        }
    });
    
    calendar.render();
}

/**
 * Fetch events from backend
 */
async function fetchCalendarEvents(successCallback, failureCallback) {
    try {
        // Get visibility settings
        const showTasks = document.getElementById('show-tasks').checked;
        const showEvents = document.getElementById('show-events').checked;
        const showDeadlines = document.getElementById('show-deadlines').checked;
        
        const response = await fetch('/api/calendar-events');
        const data = await response.json();
        
        const events = data.map(event => {
            let eventType = 'event';
            let color = eventColors.event;
            
            // Determine event type and color
            if (event.taskName) {
                eventType = 'task';
                color = eventColors.task;
            }
            
            // Filter by visibility settings
            if (eventType === 'task' && !showTasks) return null;
            if (eventType === 'event' && !showEvents) return null;
            if (event.title.toLowerCase().includes('deadline') && !showDeadlines) return null;
            
            return {
                id: event.id,
                title: event.title,
                start: event.startTime,
                end: event.endTime,
                backgroundColor: event.color || color,
                borderColor: event.color || color,
                textColor: '#fff',
                extendedProps: {
                    description: event.description,
                    location: event.location,
                    taskId: event.taskId,
                    taskName: event.taskName,
                    isAllDay: event.isAllDay,
                    reminderMinutesBefore: event.reminderMinutesBefore
                }
            };
        }).filter(e => e !== null);
        
        successCallback(events);
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}

/**
 * Load upcoming events for sidebar
 */
async function loadUpcomingEvents() {
    try {
        const response = await fetch('/api/calendar-events/upcoming?limit=5');
        const data = await response.json();
        
        const container = document.getElementById('upcoming-events');
        container.innerHTML = '';
        
        data.forEach(event => {
            const startDate = new Date(event.startTime);
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            eventDiv.innerHTML = `
                <div class="event-item-title">${event.title}</div>
                <div class="event-item-time">
                    ${startDate.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                ${event.taskName ? `<div class="event-item-task">${event.taskName}</div>` : ''}
            `;
            eventDiv.onclick = () => {
                calendar.gotoDate(event.startTime);
                showEventDetail({
                    id: event.id,
                    title: event.title,
                    extendedProps: {
                        description: event.description,
                        location: event.location,
                        taskName: event.taskName
                    }
                });
            };
            container.appendChild(eventDiv);
        });
        
        if (data.length === 0) {
            const noEventsDiv = document.createElement('div');
            noEventsDiv.style.padding = '12px';
            noEventsDiv.style.textAlign = 'center';
            noEventsDiv.style.color = 'var(--text-light)';
            noEventsDiv.innerHTML = 'No upcoming events';
            container.appendChild(noEventsDiv);
        }
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}

/**
 * Generate mini calendar in sidebar
 */
function generateMiniCalendar() {
    const today = new Date();
    const miniCalendarDiv = document.getElementById('mini-calendar');
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Get first day of month and number of days
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    let html = `
        <div style="text-align: center;">
            <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">
                ${monthNames[today.getMonth()]} ${today.getFullYear()}
            </div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                <thead>
                    <tr>
                        ${dayNames.map(d => `<th style="padding: 4px; text-align: center; font-weight: 600;">${d}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Generate calendar grid
    let day = 1;
    for (let week = 0; week < 6; week++) {
        html += '<tr>';
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            if ((week === 0 && dayOfWeek < firstDay) || day > daysInMonth) {
                html += '<td style="padding: 4px;"></td>';
            } else {
                const date = new Date(today.getFullYear(), today.getMonth(), day);
                const isToday = date.toDateString() === today.toDateString();
                const dateStr = date.toISOString().split('T')[0];
                
                html += `
                    <td style="padding: 4px; text-align: center; cursor: pointer; border-radius: 4px; ${isToday ? 'background: var(--primary); color: white; font-weight: 600;' : 'hover: background: rgba(67, 97, 238, 0.1);'}"
                        onclick="calendar.gotoDate('${dateStr}')">
                        ${day}
                    </td>
                `;
                day++;
            }
        }
        html += '</tr>';
        if (day > daysInMonth) break;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    miniCalendarDiv.innerHTML = html;
}

/**
 * Load tasks for dropdown
 */
async function loadTasksForDropdown() {
    try {
        const response = await fetch('/api/tasks/my-tasks?size=100');
        const data = await response.json();
        
        const select = document.getElementById('event-task');
        select.innerHTML = '<option value="">Select a task...</option>';
        
        if (data.content && Array.isArray(data.content)) {
            data.content.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

/**
 * Setup checkbox listeners for calendar visibility
 */
function setupCheckboxListeners() {
    const checkboxes = ['show-tasks', 'show-events', 'show-deadlines'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (calendar) {
                    calendar.refetchEvents();
                }
            });
        }
    });
}

/**
 * Open create event modal
 */
function openCreateEventModal() {
    document.getElementById('eventModal').style.display = 'block';
}

/**
 * Close event modal
 */
function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    document.getElementById('eventForm').reset();
}

/**
 * Save event
 */
async function saveEvent(e) {
    e.preventDefault();
    
    const title = document.getElementById('event-title').value;
    const startTime = document.getElementById('event-start').value;
    const endTime = document.getElementById('event-end').value;
    const description = document.getElementById('event-description').value;
    const taskId = document.getElementById('event-task').value;
    
    if (!title || !startTime || !endTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const eventData = {
        title: title,
        startTime: startTime,
        endTime: endTime,
        description: description,
        taskId: taskId ? parseInt(taskId) : null,
        color: eventColors.event,
        isAllDay: false
    };
    
    try {
        const response = await fetch('/api/calendar-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            showNotification('Event created successfully', 'success');
            closeEventModal();
            if (calendar) {
                calendar.refetchEvents();
            }
            loadUpcomingEvents();
        } else {
            const error = await response.json();
            showNotification('Error creating event: ' + (error.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showNotification('Error creating event', 'error');
    }
}

/**
 * Update event time when dragged/resized
 */
async function updateEventTime(event) {
    const eventData = {
        id: event.id,
        title: event.title,
        startTime: event.start.toISOString().slice(0, 16),
        endTime: event.end ? event.end.toISOString().slice(0, 16) : event.start.toISOString().slice(0, 16),
        description: event.extendedProps.description,
        color: event.backgroundColor
    };
    
    try {
        const response = await fetch(`/api/calendar-events/${event.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            showNotification('Event updated', 'success');
            loadUpcomingEvents();
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showNotification('Error updating event', 'error');
    }
}

/**
 * Show event detail
 */
function showEventDetail(event) {
    const detail = `
        <h3>${event.title}</h3>
        <p><strong>Time:</strong> ${event.start ? new Date(event.start).toLocaleString() : 'All day'}</p>
        ${event.extendedProps && event.extendedProps.description ? `<p><strong>Description:</strong> ${event.extendedProps.description}</p>` : ''}
        ${event.extendedProps && event.extendedProps.location ? `<p><strong>Location:</strong> ${event.extendedProps.location}</p>` : ''}
        ${event.extendedProps && event.extendedProps.taskName ? `<p><strong>Task:</strong> ${event.extendedProps.taskName}</p>` : ''}
    `;
    
    // Show in a tooltip or modal (for now, just log it)
    console.log('Event:', event);
}

/**
 * Switch calendar view
 */
function switchView(view) {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const viewMap = {
        'month': 'dayGridMonth',
        'week': 'timeGridWeek',
        'day': 'timeGridDay',
        'agenda': 'listMonth'
    };
    
    if (calendar) {
        calendar.changeView(viewMap[view]);
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create or get notification container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'error' ? '#e63946' : type === 'success' ? '#2a9d8f' : '#3498db'};
        color: white;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Close modal when clicking outside
 */
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

/**
 * Refresh events every 5 minutes
 */
setInterval(() => {
    if (calendar) {
        calendar.refetchEvents();
    }
    loadUpcomingEvents();
}, 300000);

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
