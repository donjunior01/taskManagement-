// Push Notifications Handler
// ===========================

let notificationPermission = 'default';
let messagePolling = null;
let lastMessageCount = 0;
let lastNotificationCount = 0;

// Initialize push notifications
async function initializePushNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    notificationPermission = Notification.permission;

    // If not already granted, request permission
    if (notificationPermission === 'default') {
        try {
            notificationPermission = await Notification.requestPermission();
        } catch (e) {
            console.error('Error requesting notification permission:', e);
        }
    }

    if (notificationPermission === 'granted') {
        console.log('Notification permission granted');
        startMessagePolling();
    } else {
        console.log('Notification permission denied');
    }
}

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Your browser does not support notifications', 'warning');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            showToast('Notifications enabled!', 'success');
            startMessagePolling();
            return true;
        } else {
            showToast('Notification permission denied', 'warning');
            return false;
        }
    } catch (e) {
        console.error('Error requesting notification permission:', e);
        return false;
    }
}

// Start polling for new messages
function startMessagePolling() {
    // Initial check
    checkForNewMessages();
    checkForNewNotifications();
    
    // Poll every 15 seconds
    messagePolling = setInterval(() => {
        checkForNewMessages();
        checkForNewNotifications();
    }, 15000);
}

// Stop polling
function stopMessagePolling() {
    if (messagePolling) {
        clearInterval(messagePolling);
        messagePolling = null;
    }
}

// Check for new messages
async function checkForNewMessages() {
    try {
        const response = await apiRequest('/api/messages/unread/count');
        const newCount = response.data || 0;
        
        // Update badge
        updateMessageBadge(newCount);
        
        // Show notification if count increased
        if (newCount > lastMessageCount && lastMessageCount > 0) {
            const newMessages = newCount - lastMessageCount;
            showBrowserNotification(
                'New Message',
                `You have ${newMessages} new message${newMessages > 1 ? 's' : ''}`,
                'message'
            );
        }
        
        lastMessageCount = newCount;
    } catch (e) {
        console.error('Error checking messages:', e);
    }
}

// Check for new notifications
async function checkForNewNotifications() {
    try {
        const response = await apiRequest('/api/notifications/count');
        const newCount = response.data || 0;
        
        // Update badge
        updateNotificationBadge(newCount);
        
        // Show notification if count increased
        if (newCount > lastNotificationCount && lastNotificationCount > 0) {
            showBrowserNotification(
                'New Notification',
                'You have new notifications',
                'notification'
            );
        }
        
        lastNotificationCount = newCount;
    } catch (e) {
        console.error('Error checking notifications:', e);
    }
}

// Update message badge
function updateMessageBadge(count) {
    const badge = document.querySelector('.message-badge');
    const unreadCountEl = document.getElementById('unread-message-count');
    
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    
    if (unreadCountEl) {
        unreadCountEl.textContent = count > 99 ? '99+' : count;
        unreadCountEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Show browser notification
function showBrowserNotification(title, body, type = 'general') {
    if (notificationPermission !== 'granted') return;
    
    // Check if page is visible
    if (document.visibilityState === 'visible') {
        // Page is visible, just update the UI
        return;
    }
    
    const options = {
        body: body,
        icon: '/images/notification-icon.png',
        badge: '/images/badge-icon.png',
        tag: type, // Prevents duplicate notifications of same type
        requireInteraction: false,
        silent: false,
        data: { type: type }
    };
    
    try {
        const notification = new Notification(title, options);
        
        notification.onclick = function() {
            window.focus();
            notification.close();
            
            // Navigate based on type
            if (type === 'message') {
                navigateTo('messages');
            } else {
                // Click on notification icon to show dropdown
                const dropdown = document.getElementById('notification-dropdown');
                if (dropdown) dropdown.style.display = 'block';
            }
        };
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } catch (e) {
        console.error('Error showing notification:', e);
    }
}

// Send notification to specific user (for demo purposes, this shows a local notification)
function sendNotificationToUser(userId, title, message, type = 'general') {
    // In a real implementation, this would call a backend endpoint
    // that uses WebSockets or Push API to send to the specific user
    
    // For now, we'll just log it
    console.log(`Notification for user ${userId}: ${title} - ${message}`);
    
    // If it's for the current user, show it
    if (window.currentUser?.id === userId) {
        showBrowserNotification(title, message, type);
    }
}

// Show notification when message is sent
async function notifyMessageSent(recipientId, content) {
    try {
        // Create notification in database
        await apiRequest('/api/notifications', 'POST', {
            userId: recipientId,
            title: 'New Message',
            message: `New message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            type: 'MESSAGE',
            referenceType: 'MESSAGE'
        });
    } catch (e) {
        // Ignore errors - notification is optional
        console.error('Error creating notification:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to allow other scripts to load
    setTimeout(initializePushNotifications, 1000);
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    stopMessagePolling();
});

// Make functions global
window.requestNotificationPermission = requestNotificationPermission;
window.showBrowserNotification = showBrowserNotification;
window.notifyMessageSent = notifyMessageSent;

