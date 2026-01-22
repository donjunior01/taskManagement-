// ===========================
// INTERNATIONALIZATION (i18n)
// ===========================

const translations = {
    en: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_projects: 'My Projects',
        nav_tasks: 'Team Tasks',
        nav_assignments: 'Task Assignments',
        nav_calendar: 'Calendar',
        nav_messages: 'Team Messages',
        nav_reports: 'Reports & Analytics',
        nav_deliverables: 'Deliverables',
        nav_settings: 'Settings',
        nav_logout: 'Logout',
        nav_users: 'User Management',
        nav_roles: 'Roles & Permissions',
        nav_teams: 'Team Assignments',
        nav_activity: 'Activity Logs',
        nav_integrations: 'Integrations',
        nav_security: 'Security & Backup',
        nav_support: 'Support Center',

        // Dashboard
        team_overview: 'Team Overview',
        team_members: 'Team Members',
        active_tasks: 'Active Tasks',
        overdue_tasks: 'Overdue Tasks',
        completion_rate: 'Completion Rate',
        total_tasks: 'Total Tasks',
        total_projects: 'Total Projects',
        completed_tasks: 'Completed Tasks',
        
        // Tasks
        create_task: 'Create Task',
        edit_task: 'Edit Task',
        task_name: 'Task Name',
        task_status: 'Task Status Distribution',
        team_performance: 'Team Performance',
        recent_tasks: 'Recent Tasks',
        all_team_tasks: 'All Team Tasks',
        view_all: 'View All',
        assigned_to: 'Assigned To',
        priority: 'Priority',
        status: 'Status',
        deadline: 'Deadline',
        actions: 'Actions',
        progress: 'Progress',
        description: 'Description',
        difficulty: 'Difficulty',
        
        // Projects
        my_projects: 'My Projects',
        projects_managed: 'Projects I Manage',
        project_name: 'Project Name',
        team_size: 'Team Size',
        create_new_task: 'Create New Task',
        
        // Assignments
        task_assignments: 'Task Assignments',
        assign_task: 'Assign Task',
        team_member_assignments: 'Team Member Assignments',
        team_member: 'Team Member',
        tasks_assigned: 'Tasks Assigned',
        in_progress: 'In Progress',
        completed: 'Completed',
        overdue: 'Overdue',
        
        // Calendar
        project_calendar: 'Project Calendar',
        add_event: 'Add Event',
        upcoming_events: 'Upcoming Events',
        no_upcoming_events: 'No upcoming events',
        create_event: 'Create Event',
        event_title: 'Event Title',
        start_date: 'Start Date & Time',
        end_date: 'End Date & Time',
        event_type: 'Event Type',
        color: 'Color',
        
        // Messages
        team_messages: 'Team Messages',
        compose_message: 'Compose Message',
        project_conversations: 'Project Conversations',
        direct_messages: 'Direct Messages',
        no_conversation_selected: 'No conversation selected',
        choose_conversation: 'Choose a project or team member to start messaging',
        send: 'Send',
        send_to: 'Send To',
        select_project: 'Select Project',
        select_user: 'Select User',
        message: 'Message',
        send_message: 'Send Message',
        
        // Reports
        reports_analytics: 'Reports & Analytics',
        export_report: 'Export Report',
        task_trends: 'Task Completion Trends',
        priority_breakdown: 'Tasks by Priority',
        team_performance_summary: 'Team Performance Summary',
        
        // Deliverables
        deliverables: 'Deliverables',
        submitted_deliverables: 'Submitted Deliverables',
        task: 'Task',
        submitted_by: 'Submitted By',
        file: 'File',
        submitted_at: 'Submitted At',
        review_deliverable: 'Review Deliverable',
        comments: 'Comments/Observations',
        submit_review: 'Submit Review',
        
        // Settings
        settings: 'Settings',
        save_changes: 'Save Changes',
        general_settings: 'General Settings',
        language: 'Language',
        timezone: 'Timezone',
        date_format: 'Date Format',
        time_format: 'Time Format',
        notification_settings: 'Notification Settings',
        email_notifications: 'Email Notifications',
        email_notif_desc: 'Receive task updates via email',
        task_reminders: 'Task Reminders',
        task_reminder_desc: 'Get reminders for upcoming deadlines',
        team_messages_setting: 'Team Messages',
        team_messages_desc: 'Alert for new team messages',
        deliverable_alerts: 'Deliverable Alerts',
        deliverable_alerts_desc: 'Notifications for new deliverables',
        appearance_settings: 'Appearance Settings',
        light_mode: 'Light Mode',
        dark_mode: 'Dark Mode',
        auto_mode: 'Auto (System)',
        primary_color: 'Primary Color',
        
        // Common
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        loading: 'Loading...',
        all_status: 'All Status',
        all_priorities: 'All Priorities',
        search_placeholder: 'Search...',
        assign_to: 'Assign To',
        project: 'Project',
        
        // My Tasks (User)
        my_tasks: 'My Tasks',
        my_deliverables: 'My Deliverables',
        submit_deliverable: 'Submit Deliverable',
        log_time: 'Log Time',
        report_difficulty: 'Report Difficulty'
    },
    
    fr: {
        // Navigation
        nav_dashboard: 'Tableau de bord',
        nav_projects: 'Mes Projets',
        nav_tasks: 'Tâches d\'équipe',
        nav_assignments: 'Attributions',
        nav_calendar: 'Calendrier',
        nav_messages: 'Messages',
        nav_reports: 'Rapports & Analyses',
        nav_deliverables: 'Livrables',
        nav_settings: 'Paramètres',
        nav_logout: 'Déconnexion',
        nav_users: 'Gestion Utilisateurs',
        nav_roles: 'Rôles & Permissions',
        nav_teams: 'Équipes',
        nav_activity: 'Journaux d\'activité',
        nav_integrations: 'Intégrations',
        nav_security: 'Sécurité & Sauvegarde',
        nav_support: 'Centre d\'aide',

        // Dashboard
        team_overview: 'Vue d\'ensemble de l\'équipe',
        team_members: 'Membres de l\'équipe',
        active_tasks: 'Tâches actives',
        overdue_tasks: 'Tâches en retard',
        completion_rate: 'Taux d\'achèvement',
        total_tasks: 'Total des tâches',
        total_projects: 'Total des projets',
        completed_tasks: 'Tâches terminées',
        
        // Tasks
        create_task: 'Créer une tâche',
        edit_task: 'Modifier la tâche',
        task_name: 'Nom de la tâche',
        task_status: 'Distribution des statuts',
        team_performance: 'Performance de l\'équipe',
        recent_tasks: 'Tâches récentes',
        all_team_tasks: 'Toutes les tâches',
        view_all: 'Voir tout',
        assigned_to: 'Assigné à',
        priority: 'Priorité',
        status: 'Statut',
        deadline: 'Date limite',
        actions: 'Actions',
        progress: 'Progression',
        description: 'Description',
        difficulty: 'Difficulté',
        
        // Projects
        my_projects: 'Mes Projets',
        projects_managed: 'Projets que je gère',
        project_name: 'Nom du projet',
        team_size: 'Taille de l\'équipe',
        create_new_task: 'Créer une nouvelle tâche',
        
        // Assignments
        task_assignments: 'Attributions de tâches',
        assign_task: 'Attribuer une tâche',
        team_member_assignments: 'Attributions par membre',
        team_member: 'Membre de l\'équipe',
        tasks_assigned: 'Tâches assignées',
        in_progress: 'En cours',
        completed: 'Terminé',
        overdue: 'En retard',
        
        // Calendar
        project_calendar: 'Calendrier du projet',
        add_event: 'Ajouter un événement',
        upcoming_events: 'Événements à venir',
        no_upcoming_events: 'Aucun événement à venir',
        create_event: 'Créer un événement',
        event_title: 'Titre de l\'événement',
        start_date: 'Date de début',
        end_date: 'Date de fin',
        event_type: 'Type d\'événement',
        color: 'Couleur',
        
        // Messages
        team_messages: 'Messages d\'équipe',
        compose_message: 'Rédiger un message',
        project_conversations: 'Conversations de projet',
        direct_messages: 'Messages directs',
        no_conversation_selected: 'Aucune conversation sélectionnée',
        choose_conversation: 'Choisissez un projet ou un membre pour commencer',
        send: 'Envoyer',
        send_to: 'Envoyer à',
        select_project: 'Sélectionner un projet',
        select_user: 'Sélectionner un utilisateur',
        message: 'Message',
        send_message: 'Envoyer le message',
        
        // Reports
        reports_analytics: 'Rapports & Analyses',
        export_report: 'Exporter le rapport',
        task_trends: 'Tendances d\'achèvement',
        priority_breakdown: 'Tâches par priorité',
        team_performance_summary: 'Résumé de performance',
        
        // Deliverables
        deliverables: 'Livrables',
        submitted_deliverables: 'Livrables soumis',
        task: 'Tâche',
        submitted_by: 'Soumis par',
        file: 'Fichier',
        submitted_at: 'Soumis le',
        review_deliverable: 'Examiner le livrable',
        comments: 'Commentaires',
        submit_review: 'Soumettre l\'examen',
        
        // Settings
        settings: 'Paramètres',
        save_changes: 'Enregistrer',
        general_settings: 'Paramètres généraux',
        language: 'Langue',
        timezone: 'Fuseau horaire',
        date_format: 'Format de date',
        time_format: 'Format d\'heure',
        notification_settings: 'Notifications',
        email_notifications: 'Notifications par email',
        email_notif_desc: 'Recevoir les mises à jour par email',
        task_reminders: 'Rappels de tâches',
        task_reminder_desc: 'Rappels pour les échéances',
        team_messages_setting: 'Messages d\'équipe',
        team_messages_desc: 'Alertes pour nouveaux messages',
        deliverable_alerts: 'Alertes de livrables',
        deliverable_alerts_desc: 'Notifications pour nouveaux livrables',
        appearance_settings: 'Apparence',
        light_mode: 'Mode clair',
        dark_mode: 'Mode sombre',
        auto_mode: 'Auto (Système)',
        primary_color: 'Couleur principale',
        
        // Common
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        view: 'Voir',
        loading: 'Chargement...',
        all_status: 'Tous les statuts',
        all_priorities: 'Toutes les priorités',
        search_placeholder: 'Rechercher...',
        assign_to: 'Assigner à',
        project: 'Projet',
        
        // My Tasks (User)
        my_tasks: 'Mes Tâches',
        my_deliverables: 'Mes Livrables',
        submit_deliverable: 'Soumettre un livrable',
        log_time: 'Enregistrer le temps',
        report_difficulty: 'Signaler une difficulté'
    },
    
    es: {
        // Navigation
        nav_dashboard: 'Panel de control',
        nav_projects: 'Mis Proyectos',
        nav_tasks: 'Tareas del equipo',
        nav_assignments: 'Asignaciones',
        nav_calendar: 'Calendario',
        nav_messages: 'Mensajes',
        nav_reports: 'Informes y análisis',
        nav_deliverables: 'Entregables',
        nav_settings: 'Configuración',
        nav_logout: 'Cerrar sesión',
        
        // Dashboard
        team_overview: 'Resumen del equipo',
        team_members: 'Miembros del equipo',
        active_tasks: 'Tareas activas',
        overdue_tasks: 'Tareas atrasadas',
        completion_rate: 'Tasa de finalización',
        total_tasks: 'Total de tareas',
        
        // Tasks
        create_task: 'Crear tarea',
        task_name: 'Nombre de la tarea',
        recent_tasks: 'Tareas recientes',
        assigned_to: 'Asignado a',
        priority: 'Prioridad',
        status: 'Estado',
        deadline: 'Fecha límite',
        actions: 'Acciones',
        
        // Settings
        settings: 'Configuración',
        save_changes: 'Guardar cambios',
        language: 'Idioma',
        
        // Common
        cancel: 'Cancelar',
        loading: 'Cargando...'
    },
    
    de: {
        // Navigation
        nav_dashboard: 'Dashboard',
        nav_projects: 'Meine Projekte',
        nav_tasks: 'Team-Aufgaben',
        nav_assignments: 'Zuweisungen',
        nav_calendar: 'Kalender',
        nav_messages: 'Nachrichten',
        nav_reports: 'Berichte & Analysen',
        nav_deliverables: 'Ergebnisse',
        nav_settings: 'Einstellungen',
        nav_logout: 'Abmelden',
        
        // Dashboard
        team_overview: 'Team-Übersicht',
        team_members: 'Teammitglieder',
        active_tasks: 'Aktive Aufgaben',
        overdue_tasks: 'Überfällige Aufgaben',
        completion_rate: 'Abschlussrate',
        total_tasks: 'Gesamtaufgaben',
        
        // Tasks
        create_task: 'Aufgabe erstellen',
        task_name: 'Aufgabenname',
        recent_tasks: 'Letzte Aufgaben',
        assigned_to: 'Zugewiesen an',
        priority: 'Priorität',
        status: 'Status',
        deadline: 'Frist',
        actions: 'Aktionen',
        
        // Settings
        settings: 'Einstellungen',
        save_changes: 'Änderungen speichern',
        language: 'Sprache',
        
        // Common
        cancel: 'Abbrechen',
        loading: 'Laden...'
    }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'en';

// Apply translations to the page
function applyTranslations(lang = currentLanguage) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update document title if needed
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            document.title = translations[lang][key];
        }
    }
    
    // Update language selector
    const langSelector = document.getElementById('setting-language');
    if (langSelector) {
        langSelector.value = lang;
    }
}

// Get translation for a key
function t(key) {
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key]; // Fallback to English
    }
    return key; // Return the key itself if no translation found
}

// Change language function
function changeLanguage(lang) {
    applyTranslations(lang);
    showToast(t('language') + ': ' + getLanguageName(lang), 'success');
}

// Get language name
function getLanguageName(code) {
    const names = {
        en: 'English',
        fr: 'Français',
        es: 'Español',
        de: 'Deutsch'
    };
    return names[code] || code;
}

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved language
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        applyTranslations(savedLang);
    }
    
    // Set up language selector change event
    const langSelector = document.getElementById('setting-language');
    if (langSelector) {
        langSelector.value = currentLanguage;
        langSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
});

// Export for use in other scripts
window.i18n = {
    t,
    changeLanguage,
    applyTranslations,
    currentLanguage: () => currentLanguage
};

