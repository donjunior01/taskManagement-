// ===========================
// GOOGLE CALENDAR-LIKE REDESIGN
// ===========================

let googleStyleCalendar = null;

// Initialize Google-style calendar
function initializeGoogleStyleCalendar() {
    const calendarEl = document.getElementById('calendar-view') || 
                      document.getElementById('pm-calendar') || 
                      document.getElementById('user-calendar');
    
    if (!calendarEl) return;
    
    // Destroy existing calendar if it exists
    if (googleStyleCalendar) {
        googleStyleCalendar.destroy();
    }
    
    googleStyleCalendar = new FullCalendar.Calendar(calendarEl, {
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
        height: 'auto',
        aspectRatio: 1.8,
        navLinks: true,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        nowIndicator: true,
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        allDaySlot: true,
        dayHeaderFormat: { weekday: 'short' },
        dayHeaderDidMount: function(info) {
            // Style day headers like Google Calendar
            info.el.style.fontWeight = '500';
            info.el.style.fontSize = '11px';
            info.el.style.textTransform = 'uppercase';
            info.el.style.color = 'var(--text-secondary)';
        },
        dayCellDidMount: function(info) {
            // Style day cells like Google Calendar
            if (info.isToday) {
                info.el.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            }
        },
        eventDidMount: function(info) {
            // Style events like Google Calendar
            info.el.style.borderRadius = '4px';
            info.el.style.padding = '2px 4px';
            info.el.style.fontSize = '12px';
            info.el.style.fontWeight = '500';
            info.el.style.cursor = 'pointer';
        },
        events: function(info, successCallback, failureCallback) {
            loadCalendarEvents(info.startStr, info.endStr, successCallback, failureCallback);
        },
        select: function(info) {
            // Pre-fill form with selected dates
            const startInput = document.getElementById('event-start');
            const endInput = document.getElementById('event-end');
            
            if (startInput && endInput) {
                startInput.value = formatDateTimeForInput(info.start);
                endInput.value = formatDateTimeForInput(info.end);
            }
            
            openModal('create-event-modal');
        },
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        eventDrop: function(info) {
            updateEventDates(info.event);
        },
        eventResize: function(info) {
            updateEventDates(info.event);
        },
        // Google Calendar-like styling
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
        },
        // Week view settings
        weekNumbers: false,
        weekNumberCalculation: 'ISO',
        // Month view settings
        fixedWeekCount: false,
        showNonCurrentDates: true,
        // List view settings
        listDayFormat: { weekday: 'short', month: 'short', day: 'numeric' },
        listDaySideFormat: false
    });
    
    googleStyleCalendar.render();
    
    // Load events
    loadCalendarEventsForGoogleStyle();
}

async function loadCalendarEventsForGoogleStyle() {
    try {
        const userId = window.currentUser?.id;
        if (!userId) return;
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const response = await apiRequest(`/api/calendar/range?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
        const events = response.data || [];
        
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startTime,
            end: event.endTime,
            backgroundColor: event.color || '#4361ee',
            borderColor: event.color || '#4361ee',
            textColor: '#ffffff',
            extendedProps: {
                description: event.description,
                type: event.eventType,
                location: event.location
            }
        }));
        
        if (googleStyleCalendar) {
            googleStyleCalendar.removeAllEvents();
            googleStyleCalendar.addEventSource(formattedEvents);
        }
    } catch (error) {
        console.error('Error loading calendar events:', error);
    }
}

async function loadCalendarEvents(startStr, endStr, successCallback, failureCallback) {
    try {
        const userId = window.currentUser?.id;
        if (!userId) {
            successCallback([]);
            return;
        }
        
        const response = await apiRequest(`/api/calendar/range?start=${startStr}&end=${endStr}`);
        const events = response.data || [];
        
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startTime,
            end: event.endTime,
            backgroundColor: event.color || '#4361ee',
            borderColor: event.color || '#4361ee',
            textColor: '#ffffff',
            allDay: event.allDay || false,
            extendedProps: {
                description: event.description,
                type: event.eventType,
                location: event.location
            }
        }));
        
        successCallback(formattedEvents);
    } catch (error) {
        console.error('Error loading calendar events:', error);
        failureCallback(error);
    }
}

function formatDateTimeForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showEventDetails(event) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'event-detail-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">${event.title}</h3>
                <button class="close-btn" onclick="closeModal('event-detail-modal')">×</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px;">
                    <strong>Time:</strong> ${formatEventTime(event)}
                </div>
                ${event.extendedProps?.description ? `
                    <div style="margin-bottom: 16px;">
                        <strong>Description:</strong>
                        <p>${event.extendedProps.description}</p>
                    </div>
                ` : ''}
                ${event.extendedProps?.location ? `
                    <div style="margin-bottom: 16px;">
                        <strong>Location:</strong> ${event.extendedProps.location}
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('event-detail-modal')">Close</button>
                <button type="button" class="btn btn-primary" onclick="editEvent(${event.id})">Edit</button>
                <button type="button" class="btn btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function formatEventTime(event) {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : null;
    
    if (event.allDay) {
        return start.toLocaleDateString();
    }
    
    const startStr = start.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    if (end) {
        const endStr = end.toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        return `${startStr} - ${endStr}`;
    }
    
    return startStr;
}

async function updateEventDates(event) {
    try {
        const startTime = event.start.toISOString();
        const endTime = event.end ? event.end.toISOString() : null;
        
        await apiRequest(`/api/calendar/${event.id}`, 'PUT', {
            startTime,
            endTime: endTime || startTime
        });
        
        showToast('Event updated successfully', 'success');
    } catch (error) {
        console.error('Error updating event:', error);
        showToast('Error updating event', 'error');
        // Revert the change
        googleStyleCalendar.refetchEvents();
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        await apiRequest(`/api/calendar/${eventId}`, 'DELETE');
        showToast('Event deleted successfully', 'success');
        closeModal('event-detail-modal');
        googleStyleCalendar.refetchEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Error deleting event', 'error');
    }
}

// Make functions available globally
window.initializeGoogleStyleCalendar = initializeGoogleStyleCalendar;
window.loadCalendarEvents = loadCalendarEvents;
window.showEventDetails = showEventDetails;
window.updateEventDates = updateEventDates;
window.deleteEvent = deleteEvent;



