// Deliverable Management Script

// Load deliverables
async function loadDeliverables(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/deliverables?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('deliverables-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        data.content.forEach(deliverable => {
            const row = document.createElement('tr');
            const statusClass = `badge-${
                deliverable.status === 'APPROVED' ? 'success' :
                deliverable.status === 'REJECTED' ? 'danger' : 'warning'
            }`;
            
            row.innerHTML = `
                <td>${deliverable.submittedBy}</td>
                <td>${deliverable.fileName}</td>
                <td><span class="badge ${statusClass}">${deliverable.status}</span></td>
                <td>${deliverable.fileSize ? (deliverable.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}</td>
                <td>${new Date(deliverable.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewDeliverable(${deliverable.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${deliverable.status === 'PENDING' ? `
                    <button class="btn btn-sm btn-success" onclick="approveDeliverable(${deliverable.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectDeliverable(${deliverable.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading deliverables:', error);
    }
}

// View deliverable
async function viewDeliverable(id) {
    try {
        const response = await fetch(`/api/deliverables/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const deliverable = data.data;
            // Open in new tab
            window.open(deliverable.fileUrl, '_blank');
        }
    } catch (error) {
        console.error('Error viewing deliverable:', error);
        showNotification('Error viewing deliverable', 'error');
    }
}

// Approve deliverable
async function approveDeliverable(id) {
    const comments = prompt('Add approval comments (optional):');
    
    try {
        const response = await fetch(`/api/deliverables/${id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comments: comments || '' })
        });
        
        if (response.ok) {
            showNotification('Deliverable approved successfully', 'success');
            loadDeliverables();
        }
    } catch (error) {
        console.error('Error approving deliverable:', error);
        showNotification('Error approving deliverable', 'error');
    }
}

// Reject deliverable
async function rejectDeliverable(id) {
    const comments = prompt('Add rejection reason:');
    
    if (!comments) {
        showNotification('Rejection reason is required', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/deliverables/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comments: comments })
        });
        
        if (response.ok) {
            showNotification('Deliverable rejected successfully', 'success');
            loadDeliverables();
        }
    } catch (error) {
        console.error('Error rejecting deliverable:', error);
        showNotification('Error rejecting deliverable', 'error');
    }
}

// Load user deliverables (for user dashboard)
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
                    <button class="btn btn-sm btn-info" onclick="downloadDeliverable(${deliverable.id})">
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

// Submit deliverable (user)
async function submitDeliverable(taskId) {
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
        
        if (response.ok) {
            showNotification('Deliverable submitted successfully', 'success');
            fileInput.value = '';
            loadUserDeliverables();
        } else {
            showNotification('Error submitting deliverable', 'error');
        }
    } catch (error) {
        console.error('Error submitting deliverable:', error);
        showNotification('Error submitting deliverable', 'error');
    }
}

// Download deliverable
async function downloadDeliverable(id) {
    try {
        const response = await fetch(`/api/deliverables/${id}`);
        const data = await response.json();
        
        if (data.success) {
            // Trigger file download
            const link = document.createElement('a');
            link.href = data.data.fileUrl;
            link.download = data.data.fileName;
            link.click();
        }
    } catch (error) {
        console.error('Error downloading deliverable:', error);
        showNotification('Error downloading deliverable', 'error');
    }
}

// Helper notification function
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
