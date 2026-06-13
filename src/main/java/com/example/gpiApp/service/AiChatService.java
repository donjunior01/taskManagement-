package com.example.gpiApp.service;

import com.example.gpiApp.dto.AiChatRequestDTO;
import com.example.gpiApp.dto.AiChatResponseDTO;
import com.example.gpiApp.dto.GenerateDescriptionRequestDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Conversational AI assistant. Implements a tiered fallback chain: OpenAI (gpt-4o, primary) →
 * Claude (Anthropic) → Gemini (Google) → deterministic, data-grounded responses.
 * Mirrored on seruca's approach: robust region-independent coverage with multiple models
 * and graceful fallback to rule-based engine when API keys are absent or APIs fail.
 *
 * Capabilities:
 *  - Answer questions about the user's projects and tasks (optionally scoped to one).
 *  - Draft descriptions for a project, task, or deliverable on creation.
 *  - Produce step-by-step guidance for completing a task from its description.
 */
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final LangChainAiClient langChainClient;
    private final SystemSettingsService systemSettings;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    private static final String ASSISTANT_SYSTEM_PROMPT = """
            You are TaskMaster Pro Assistant, an AI helper embedded in a project & task management application
            (TaskMaster Pro). You help administrators, project managers and team members understand their
            projects and tasks, decide what to work on, figure out how to complete their work, AND learn how
            to use the application itself.
            You can:
              - answer questions about the projects and tasks in the provided context,
              - explain what a task is asking for and propose concrete, ordered guidelines to complete it,
              - help draft clear descriptions for projects, tasks, and deliverables,
              - guide users (especially admins) on how to use their dashboard and perform actions.

            APPLICATION GUIDE (use this to answer "how do I..." / "what is this" / "what should I do" questions):
            Roles & areas:
              - Admin: full control. Sidebar = Tableau de bord, Utilisateurs, Projets, Tâches, Équipes,
                Rapports, Support, Configuration. The admin dashboard shows KPIs (utilisateurs, projets actifs,
                tâches, tentatives échouées, tickets support, disponibilité), charts (Activité Utilisateurs,
                Projets/Tickets par statut, Répartition des rôles) and feeds (alertes de sécurité, journal).
              - Project Manager (Chef de projet): manages their own projects, tasks, teams, deliverables,
                calendar, analytics and reports.
              - Collaborator (Utilisateur): works their assigned tasks, submits deliverables, logs time,
                uses the calendar and messaging.
            How to perform common admin actions:
              - Create a user: Utilisateurs > "Nouvel utilisateur"; reset a user's password via the key/reset
                action in the user row (it emails a temporary password that respects the password policy).
              - Activate/suspend a user: toggle the status action in the user row; new self-registered accounts
                start inactive and must be activated here.
              - Create/launch a project: Projets > "Créer un projet"; filter projects by status, manager, team
                or period; edit via the row pencil; archive via the archive action.
              - Create/assign tasks: Tâches > "Nouvelle tâche"; assign, change status, or bulk-edit.
              - Configure the platform: Configuration > Général (nom, langue, fuseau), Sécurité (validité JWT,
                politique de mot de passe, 2FA), Notifications (SMTP + déclencheurs), Intégrations, Sauvegarde
                (rétention, mode maintenance). Security/password-policy changes take effect immediately.
              - Any description field in a creation/edit modal has an AI "Generate with AI" button that drafts
                a description from the title.

            Rules: base factual statements about specific projects/tasks/users strictly on the CONTEXT provided
            in the user message; if the context lacks the answer, say so instead of inventing. For "how to use
            the app" questions, you may rely on the APPLICATION GUIDE above. Be concise and practical. Use short
            paragraphs or bullet points. Do not use emoji (accented characters for the response language are fine).
            """;

    private static final String DESCRIPTION_SYSTEM_PROMPT = """
            You are a writing assistant for a project & task management application. Given an item type
            (project, task, or deliverable), a title, and optional context, write a single clear, professional
            description of 2 to 4 sentences that states the objective, the expected outcome, and any obvious
            scope. Respond with ONLY the description text, no preamble, no quotes, no emoji.
            """;

    private static final String GUIDANCE_SYSTEM_PROMPT = """
            You are a delivery coach in a task management application. Given a task's title and description,
            explain briefly what is being asked, then propose a short ordered checklist (3 to 6 steps) of how
            to approach and complete it. Do not use emoji. Format as: a one-line summary, then steps as
            lines beginning with a number and a period (e.g. "1. ...").
            """;

    // ──────────────────────────────────────────────────────────────────────────
    // Chat
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AiChatResponseDTO chat(AiChatRequestDTO request, Long userId) {
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        if (message.isEmpty()) {
            return AiChatResponseDTO.builder().reply("Please type a question.").source("MOCK").build();
        }

        String context = buildContext(request, userId);

        // Try a live, multi-turn answer first.
        List<Map<String, String>> turns = new ArrayList<>();
        if (request.getHistory() != null) {
            for (Map<String, String> h : request.getHistory()) {
                String role = h.getOrDefault("role", "user");
                String content = h.getOrDefault("content", "");
                if (content != null && !content.isBlank()) {
                    turns.add(Map.of("role", "assistant".equals(role) ? "assistant" : "user", "content", content));
                }
            }
        }
        // Keep history bounded to control token use.
        if (turns.size() > 10) {
            turns = new ArrayList<>(turns.subList(turns.size() - 10, turns.size()));
        }
        turns.add(Map.of("role", "user", "content", "CONTEXT:\n" + context + "\n\nQUESTION:\n" + message));

        // AI via the LangChain.js + Gemini sidecar; deterministic, data-grounded fallback otherwise.
        final List<Map<String, String>> chatTurns = turns;
        return langChainClient.chat(withLanguage(ASSISTANT_SYSTEM_PROMPT), chatTurns)
                .map(reply -> AiChatResponseDTO.builder().reply(reply).source("AI").build())
                .orElseGet(() -> AiChatResponseDTO.builder()
                        .reply(fallbackChat(request, message, context))
                        .source("MOCK").build());
    }

    private String buildContext(AiChatRequestDTO request, Long userId) {
        if (request.getTaskId() != null) {
            return taskRepository.findById(request.getTaskId())
                    .map(this::describeTask)
                    .orElse("No task was found for the requested id.");
        }
        if (request.getProjectId() != null) {
            return projectRepository.findById(request.getProjectId())
                    .map(this::describeProject)
                    .orElse("No project was found for the requested id.");
        }
        // Default: the signed-in user's own workload.
        return describeUserWorkload(userId);
    }

    private String describeTask(Task t) {
        StringBuilder sb = new StringBuilder();
        sb.append("TASK\n");
        sb.append("Name: ").append(safe(t.getName())).append('\n');
        if (t.getProject() != null) sb.append("Project: ").append(safe(t.getProject().getName())).append('\n');
        sb.append("Status: ").append(t.getStatus()).append('\n');
        sb.append("Priority: ").append(t.getPriority()).append('\n');
        sb.append("Difficulty: ").append(t.getDifficulty()).append('\n');
        sb.append("Progress: ").append(t.getProgress() == null ? 0 : t.getProgress()).append("%\n");
        if (t.getDeadline() != null) sb.append("Deadline: ").append(t.getDeadline()).append('\n');
        if (t.getAssignedTo() != null)
            sb.append("Assigned to: ").append(fullName(t.getAssignedTo())).append('\n');
        sb.append("Description: ").append(t.getDescription() == null || t.getDescription().isBlank()
                ? "(no description provided)" : t.getDescription()).append('\n');
        return sb.toString();
    }

    private String describeProject(Project p) {
        StringBuilder sb = new StringBuilder();
        sb.append("PROJECT\n");
        sb.append("Name: ").append(safe(p.getName())).append('\n');
        sb.append("Status: ").append(p.getStatus()).append('\n');
        sb.append("Progress: ").append(p.getProgress() == null ? 0 : p.getProgress()).append("%\n");
        if (p.getStartDate() != null) sb.append("Start: ").append(p.getStartDate()).append('\n');
        if (p.getEndDate() != null) sb.append("End: ").append(p.getEndDate()).append('\n');
        sb.append("Description: ").append(p.getDescription() == null || p.getDescription().isBlank()
                ? "(no description)" : p.getDescription()).append('\n');
        List<Task> tasks = taskRepository.findByProject(p);
        sb.append("Tasks (").append(tasks.size()).append("):\n");
        for (Task t : tasks) {
            sb.append("  - ").append(safe(t.getName()))
              .append(" [").append(t.getStatus()).append(", ").append(t.getPriority())
              .append(t.getDeadline() != null ? ", due " + t.getDeadline() : "")
              .append("]\n");
        }
        return sb.toString();
    }

    private String describeUserWorkload(Long userId) {
        if (userId == null) return "No signed-in user context is available.";
        allUsers user = userRepository.findById(userId).orElse(null);
        if (user == null) return "No signed-in user context is available.";
        boolean fr = isFrench();
        List<Task> tasks = taskRepository.findByAssignedTo(user);
        StringBuilder sb = new StringBuilder();
        sb.append(fr ? "UTILISATEUR : " : "USER: ").append(fullName(user)).append('\n');
        sb.append(fr ? "Tâches assignées (" : "Assigned tasks (").append(tasks.size()).append("):\n");
        for (Task t : tasks) {
            sb.append("  - ").append(safe(t.getName()))
              .append(" [").append(t.getStatus()).append(", ").append(t.getPriority())
              .append(t.getDeadline() != null ? (fr ? ", échéance " : ", due ") + t.getDeadline() : "")
              .append(", ").append(t.getProgress() == null ? 0 : t.getProgress()).append("%]")
              .append(t.getProject() != null ? (fr ? " dans " : " in ") + safe(t.getProject().getName()) : "")
              .append('\n');
        }
        if (tasks.isEmpty()) sb.append(fr ? "  (aucune tâche assignée actuellement)\n" : "  (no tasks currently assigned)\n");
        return sb.toString();
    }

    private String fallbackChat(AiChatRequestDTO request, String message, String context) {
        // Deterministic, data-grounded reply when the AI sidecar is unavailable.
        if (isFrench()) {
            return "L'assistant IA est hors ligne pour le moment. Voici les informations pertinentes de votre espace de travail :\n\n"
                    + context
                    + "\nConseil : démarrez le service IA (cd ai-service && npm start) avec une clé GEMINI_API_KEY valide pour obtenir des réponses conversationnelles et des conseils personnalisés.";
        }
        return "The AI assistant is offline right now, so here is the relevant information from your workspace:\n\n"
                + context
                + "\nTip: start the LangChain.js AI service (cd ai-service && npm start) with a valid GEMINI_API_KEY to get conversational answers and tailored guidance.";
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Description generation
    // ──────────────────────────────────────────────────────────────────────────

    public String generateDescription(GenerateDescriptionRequestDTO request) {
        String type = request.getType() == null ? "task" : request.getType().toLowerCase();
        String name = request.getName() == null ? "" : request.getName().trim();
        String context = request.getContext() == null ? "" : request.getContext().trim();
        if (name.isEmpty()) {
            return "Please provide a title first, then generate a description.";
        }

        String userContent = "Type: " + type + "\nTitle: " + name
                + (context.isEmpty() ? "" : "\nContext: " + context);

        return langChainClient.complete(withLanguage(DESCRIPTION_SYSTEM_PROMPT), userContent)
                .map(String::trim)
                .orElseGet(() -> fallbackDescription(type, name, context));
    }

    private String fallbackDescription(String type, String name, String context) {
        String subject = (type == null || type.isBlank()) ? (isFrench() ? "élément" : "item") : type;
        StringBuilder sb = new StringBuilder();
        if (isFrench()) {
            sb.append("Cet élément (").append(subject).append(") concerne « ").append(name).append(" ». ");
            sb.append("Il définit le travail nécessaire pour livrer « ").append(name).append(" »");
            if (!context.isEmpty()) sb.append(" dans le cadre de ").append(context);
            sb.append(", y compris l'objectif principal, le résultat attendu et les critères d'acceptation. ");
            sb.append("Mettez à jour cette description avec la portée, les dépendances et les échéances dès qu'elles sont confirmées.");
            return sb.toString();
        }
        sb.append("This ").append(subject).append(" covers \"").append(name).append("\". ");
        sb.append("It defines the work required to deliver \"").append(name).append("\"");
        if (!context.isEmpty()) sb.append(" within ").append(context);
        sb.append(", including the main objective, the expected outcome, and the acceptance criteria. ");
        sb.append("Update this description with specific scope, dependencies, and deadlines as they are confirmed.");
        return sb.toString();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Task guidance
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AiChatResponseDTO taskGuidance(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return AiChatResponseDTO.builder().reply("Task not found.").source("MOCK").build();
        }
        String userContent = "Task title: " + safe(task.getName()) + "\nDescription: "
                + (task.getDescription() == null || task.getDescription().isBlank()
                    ? "(no description provided)" : task.getDescription())
                + (task.getDeadline() != null ? "\nDeadline: " + task.getDeadline() : "")
                + "\nPriority: " + task.getPriority();

        return langChainClient.complete(withLanguage(GUIDANCE_SYSTEM_PROMPT), userContent)
                .map(reply -> AiChatResponseDTO.builder().reply(reply).source("AI").build())
                .orElseGet(() -> AiChatResponseDTO.builder()
                        .reply(fallbackGuidance(task)).source("MOCK").build());
    }

    private String fallbackGuidance(Task task) {
        String name = safe(task.getName());
        if (isFrench()) {
            return "Objectif : terminer « " + name + " ».\n"
                    + "1. Relisez la description de la tâche et listez précisément ce qui est demandé.\n"
                    + "2. Décomposez le travail en petites sous-étapes vérifiables.\n"
                    + "3. Confirmez les entrées, dépendances ou accès nécessaires avant de commencer.\n"
                    + "4. Réalisez le travail dans l'ordre, en enregistrant vos heures au fur et à mesure.\n"
                    + "5. Testez ou vérifiez le résultat par rapport au résultat attendu de la tâche.\n"
                    + "6. Soumettez le livrable et prévenez votre chef de projet pour relecture.";
        }
        return "Goal: complete \"" + name + "\".\n"
                + "1. Re-read the task description and list exactly what is being asked.\n"
                + "2. Break the work into small, verifiable sub-steps.\n"
                + "3. Confirm any inputs, dependencies, or access you need before starting.\n"
                + "4. Do the work in order, logging your hours as you progress.\n"
                + "5. Test or review the result against the task's expected outcome.\n"
                + "6. Submit the deliverable and notify your project manager for review.";
    }

    private String fullName(allUsers u) {
        return (safe(u.getFirstName()) + " " + safe(u.getLastName())).trim();
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    /** Append a language directive so the model replies in the admin-configured language. */
    private String withLanguage(String systemPrompt) {
        String lang = systemSettings.getAiLanguageName();
        return systemPrompt + "\n\nLANGUAGE: Respond entirely in " + lang
                + ". Every sentence, heading and list item must be written in " + lang
                + ", using that language's normal accented characters.";
    }

    /** True when the configured AI language is French (drives the localized rule-based fallbacks). */
    private boolean isFrench() {
        return "French".equalsIgnoreCase(systemSettings.getAiLanguageName());
    }
}
