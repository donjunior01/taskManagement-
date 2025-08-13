// Weekly Planning Management System
class WeeklyPlanningManager {
    constructor() {
        this.currentUser = null;
        this.weeklyPlans = [];
        this.dailySchedules = [];
        this.charts = {};
        this.currentWeek = this.getCurrentWeek();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadWeeklyPlanningData();
        this.populateWeekGrid();
        this.loadTasksForScheduling();
    }

    // Get current week number
    getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + start.getDay() + 1) / 7);
    }

    // Load current user information
    async loadCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user', {
                credentials: 'include'
            });
            if (response.ok) {
                this.currentUser = await response.json();
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submissions
        const createForm = document.getElementById('create-weekly-planning-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateWeeklyPlanning();
            });
        }

        const editForm = document.getElementById('edit-weekly-planning-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditWeeklyPlanning();
            });
        }

        const taskScheduleForm = document.getElementById('task-schedule-form');
        if (taskScheduleForm) {
            taskScheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTaskScheduling();
            });
        }

        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteWeeklyPlanning();
            });
        }

        // Set default dates for forms
        this.setDefaultDates();
    }

    // Set default dates for forms
    setDefaultDates() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Set default dates in create form
        const weekStartInput = document.getElementById('week-start-date');
        const weekEndInput = document.getElementById('week-end-date');
        const yearInput = document.getElementById('year');
        const weekNumberInput = document.getElementById('week-number');

        if (weekStartInput) weekStartInput.value = weekStart.toISOString().split('T')[0];
        if (weekEndInput) weekEndInput.value = weekEnd.toISOString().split('T')[0];
        if (yearInput) yearInput.value = this.currentYear;
        if (weekNumberInput) weekNumberInput.value = this.currentWeek;
    }

    // Initialize charts
    initializeCharts() {
        // Weekly Task Distribution Chart
        const weeklyTaskCtx = document.getElementById('weekly-task-distribution-chart');
        if (weeklyTaskCtx) {
            this.charts.weeklyTaskDistribution = new Chart(weeklyTaskCtx, {
                type: 'bar',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    datasets: [{
                        label: 'Tasks Planned',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#007bff',
                        borderColor: '#0056b3',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Task Completion Trend Chart
        const completionTrendCtx = document.getElementById('task-completion-trend-chart');
        if (completionTrendCtx) {
            this.charts.taskCompletionTrend = new Chart(completionTrendCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Completed Tasks',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }

    // Load weekly planning data
    async loadWeeklyPlanningData() {
        try {
            const response = await fetch('/api/weekly-plannings', {
                credentials: 'include'
            });
            if (response.ok) {
                this.weeklyPlans = await response.json();
                this.updateWeeklyPlanningList();
                this.updateStatistics();
                this.updateCharts();
            }
        } catch (error) {
            console.error('Error loading weekly planning data:', error);
        }
    }

    // Update weekly planning list
    updateWeeklyPlanningList() {
        const container = document.getElementById('weekly-planning-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.weeklyPlans.length === 0) {
            container.innerHTML = '<p class="no-data">No weekly plans found. Create your first plan to get started!</p>';
            return;
        }

        this.weeklyPlans.forEach(plan => {
            const planElement = this.createWeeklyPlanningElement(plan);
            container.appendChild(planElement);
        });
    }

    // Create weekly planning element
    createWeeklyPlanningElement(plan) {
        const planDiv = document.createElement('div');
        planDiv.className = 'weekly-plan-item';
        planDiv.setAttribute('data-plan-id', plan.planningId);
        
        const statusClass = plan.complianceStatus?.toLowerCase().replace('_', '-') || 'unknown';
        const approvalStatus = plan.isApproved ? 'Approved' : 'Pending Approval';
        
        planDiv.innerHTML = `
            <div class="plan-header">
                <h4>Week ${plan.weekNumber}, ${plan.year}</h4>
                <span class="plan-status ${statusClass}">${plan.complianceStatus || 'Unknown'}</span>
            </div>
            <div class="plan-content">
                <div class="plan-dates">
                    <span><strong>Start:</strong> ${new Date(plan.weekStartDate).toLocaleDateString()}</span>
                    <span><strong>End:</strong> ${new Date(plan.weekEndDate).toLocaleDateString()}</span>
                </div>
                <div class="plan-tasks">
                    <span><strong>Total Tasks:</strong> ${plan.totalTasksPlanned || 0}</span>
                    <span><strong>Completed:</strong> ${plan.completedTasksCount || 0}</span>
                    <span><strong>Pending:</strong> ${plan.pendingTasksCount || 0}</span>
                </div>
                <div class="plan-approval">
                    <span><strong>Status:</strong> ${approvalStatus}</span>
                    ${plan.approvedByName ? `<span><strong>Approved by:</strong> ${plan.approvedByName}</span>` : ''}
                </div>
            </div>
            <div class="plan-actions">
                <button class="btn btn-sm btn-secondary btn-edit" onclick="weeklyPlanningManager.openEditModal(${plan.planningId})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-info" onclick="weeklyPlanningManager.openTaskScheduleModal(${plan.planningId})">
                    <i class="fas fa-clock"></i> Schedule Tasks
                </button>
                <button class="btn btn-sm btn-danger btn-delete" onclick="weeklyPlanningManager.openDeleteModal(${plan.planningId})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        return planDiv;
    }

    // Update statistics
    updateStatistics() {
        const totalPlans = this.weeklyPlans.length;
        const totalCompletedTasks = this.weeklyPlans.reduce((sum, plan) => sum + (plan.completedTasksCount || 0), 0);
        const totalPendingTasks = this.weeklyPlans.reduce((sum, plan) => sum + (plan.pendingTasksCount || 0), 0);
        const complianceRate = totalPlans > 0 ? Math.round((totalCompletedTasks / (totalCompletedTasks + totalPendingTasks)) * 100) : 0;

        // Update stat cards
        this.updateStatCard('total-plans', totalPlans);
        this.updateStatCard('completed-tasks', totalCompletedTasks);
        this.updateStatCard('pending-tasks', totalPendingTasks);
        this.updateStatCard('compliance-rate', `${complianceRate}%`);
    }

    // Update stat card
    updateStatCard(statKey, value) {
        const statElement = document.querySelector(`[data-stat="${statKey}"] .stat-info h3`);
        if (statElement) {
            statElement.textContent = value;
        }
    }

    // Update charts
    updateCharts() {
        // Update Weekly Task Distribution Chart
        if (this.charts.weeklyTaskDistribution) {
            const dailyTaskCounts = this.calculateDailyTaskCounts();
            this.charts.weeklyTaskDistribution.data.datasets[0].data = dailyTaskCounts;
            this.charts.weeklyTaskDistribution.update();
        }

        // Update Task Completion Trend Chart
        if (this.charts.taskCompletionTrend) {
            const weeklyCompletionData = this.calculateWeeklyCompletionTrend();
            this.charts.taskCompletionTrend.data.labels = weeklyCompletionData.labels;
            this.charts.taskCompletionTrend.data.datasets[0].data = weeklyCompletionData.data;
            this.charts.taskCompletionTrend.update();
        }
    }

    // Calculate daily task counts
    calculateDailyTaskCounts() {
        const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        
        this.dailySchedules.forEach(schedule => {
            const dayOfWeek = new Date(schedule.scheduledDate).getDay();
            // Convert Sunday=0 to Monday=0
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dailyCounts[adjustedDay]++;
        });
        
        return dailyCounts;
    }

    // Calculate weekly completion trend
    calculateWeeklyCompletionTrend() {
        const weeklyData = {};
        
        this.weeklyPlans.forEach(plan => {
            const weekKey = `Week ${plan.weekNumber}`;
            weeklyData[weekKey] = plan.completedTasksCount || 0;
        });
        
        return {
            labels: Object.keys(weeklyData),
            data: Object.values(weeklyData)
        };
    }

    // Populate week grid
    populateWeekGrid() {
        const weekGrid = document.getElementById('week-grid');
        if (!weekGrid) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        weekGrid.innerHTML = '';

        days.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-column';
            dayDiv.innerHTML = `
                <h4>${day}</h4>
                <div class="day-tasks" data-day="${day.toLowerCase()}">
                    <p class="no-tasks">No tasks scheduled</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="weeklyPlanningManager.openTaskScheduleModal(null, '${day}')">
                    <i class="fas fa-plus"></i> Add Task
                </button>
            `;
            weekGrid.appendChild(dayDiv);
        });
    }

    // Load tasks for scheduling
    async loadTasksForScheduling() {
        try {
            const response = await fetch('/api/tasks', {
                credentials: 'include'
            });
            if (response.ok) {
                const tasks = await response.json();
                this.populateTaskSelect(tasks);
            }
        } catch (error) {
            console.error('Error loading tasks for scheduling:', error);
        }
    }

    // Populate task select
    populateTaskSelect(tasks) {
        const taskSelect = document.getElementById('schedule-task');
        if (!taskSelect) return;

        // Clear existing options except the first one
        taskSelect.innerHTML = '<option value="">Choose a task...</option>';
        
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            taskSelect.appendChild(option);
        });
    }

    // Handle create weekly planning
    async handleCreateWeeklyPlanning() {
        const form = document.getElementById('create-weekly-planning-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/weekly-plannings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    userId: this.currentUser?.userId
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Weekly plan created successfully!');
                closeModal('create-weekly-planning-modal');
                form.reset();
                this.setDefaultDates();
                this.loadWeeklyPlanningData();
            } else {
                alert('Error creating weekly plan');
            }
        } catch (error) {
            console.error('Error creating weekly plan:', error);
            alert('Error creating weekly plan');
        }
    }

    // Handle edit weekly planning
    async handleEditWeeklyPlanning() {
        const form = document.getElementById('edit-weekly-planning-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const planningId = document.getElementById('edit-planning-id').value;

        try {
            const response = await fetch(`/api/weekly-plannings/${planningId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Weekly plan updated successfully!');
                closeModal('edit-weekly-planning-modal');
                this.loadWeeklyPlanningData();
            } else {
                alert('Error updating weekly plan');
            }
        } catch (error) {
            console.error('Error updating weekly plan:', error);
            alert('Error updating weekly plan');
        }
    }

    // Handle task scheduling
    async handleTaskScheduling() {
        const form = document.getElementById('task-schedule-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/daily-task-schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Task scheduled successfully!');
                closeModal('task-schedule-modal');
                form.reset();
                this.loadWeeklyPlanningData();
            } else {
                alert('Error scheduling task');
            }
        } catch (error) {
            console.error('Error scheduling task:', error);
            alert('Error scheduling task');
        }
    }

    // Open edit modal
    openEditModal(planningId) {
        const plan = this.weeklyPlans.find(p => p.planningId === planningId);
        if (!plan) return;

        // Populate form fields
        document.getElementById('edit-planning-id').value = plan.planningId;
        document.getElementById('edit-week-number').value = plan.weekNumber;
        document.getElementById('edit-year').value = plan.year;
        document.getElementById('edit-week-start-date').value = plan.weekStartDate;
        document.getElementById('edit-week-end-date').value = plan.weekEndDate;
        document.getElementById('edit-total-tasks-planned').value = plan.totalTasksPlanned;

        openModal('edit-weekly-planning-modal');
    }

    // Open delete modal
    openDeleteModal(planningId) {
        this.currentDeleteId = planningId;
        openModal('delete-confirmation-modal');
    }

    // Delete weekly planning
    async deleteWeeklyPlanning() {
        if (!this.currentDeleteId) return;

        try {
            const response = await fetch(`/api/weekly-plannings/${this.currentDeleteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('Weekly plan deleted successfully!');
                closeModal('delete-confirmation-modal');
                this.loadWeeklyPlanningData();
            } else {
                alert('Error deleting weekly plan');
            }
        } catch (error) {
            console.error('Error deleting weekly plan:', error);
            alert('Error deleting weekly plan');
        }
    }

    // Open task schedule modal
    openTaskScheduleModal(planningId, day = null) {
        if (day) {
            // Set default date for the selected day
            const today = new Date();
            const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day.toLowerCase());
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
            
            document.getElementById('schedule-date').value = targetDate.toISOString().split('T')[0];
        }
        
        openModal('task-schedule-modal');
    }

    // Filter weekly plans
    filterWeeklyPlans() {
        const weekFilter = document.getElementById('week-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        const filteredPlans = this.weeklyPlans.filter(plan => {
            const weekMatch = !weekFilter || plan.weekNumber.toString() === weekFilter;
            const statusMatch = !statusFilter || plan.complianceStatus === statusFilter;
            return weekMatch && statusMatch;
        });

        this.updateWeeklyPlanningListWithData(filteredPlans);
    }

    // Update weekly planning list with specific data
    updateWeeklyPlanningListWithData(plans) {
        const container = document.getElementById('weekly-planning-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (plans.length === 0) {
            container.innerHTML = '<p class="no-data">No weekly plans match the selected filters.</p>';
            return;
        }

        plans.forEach(plan => {
            const planElement = this.createWeeklyPlanningElement(plan);
            container.appendChild(planElement);
        });
    }

    // Refresh weekly planning data
    refreshWeeklyPlanningData() {
        this.loadWeeklyPlanningData();
    }
}

// Initialize weekly planning manager when the page loads
let weeklyPlanningManager;
document.addEventListener('DOMContentLoaded', () => {
    weeklyPlanningManager = new WeeklyPlanningManager();
});

// Global functions for HTML onclick attributes
window.refreshWeeklyPlanningData = function() {
    if (weeklyPlanningManager) {
        weeklyPlanningManager.refreshWeeklyPlanningData();
    }
};

window.filterWeeklyPlans = function() {
    if (weeklyPlanningManager) {
        weeklyPlanningManager.filterWeeklyPlans();
    }
}; 