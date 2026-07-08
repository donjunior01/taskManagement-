package com.example.gpiApp.service;

import com.example.gpiApp.dto.SearchResponseDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.WikiPage;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Global full-text search across projects, tasks and wiki pages. Runs inside a @Transactional
 * method so the tenant @Filter scopes every query to the caller's organization — results can never
 * cross an org boundary. Per-group result count is capped so the dropdown stays fast.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MAX_PER_GROUP = 8;
    private static final int SNIPPET_LEN = 140;

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final WikiPageRepository wikiPageRepository;

    @Transactional(readOnly = true)
    public SearchResponseDTO search(String query, Integer limit) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) {
            return SearchResponseDTO.builder()
                    .query(q).total(0)
                    .projects(List.of()).tasks(List.of()).wiki(List.of())
                    .build();
        }
        int perGroup = (limit == null) ? MAX_PER_GROUP : Math.max(1, Math.min(limit, MAX_PER_GROUP));
        Pageable page = PageRequest.of(0, perGroup);

        List<SearchResponseDTO.Item> projects = new ArrayList<>();
        for (Project p : projectRepository.searchProjects(q, page)) {
            projects.add(SearchResponseDTO.Item.builder()
                    .type("project").id(p.getId()).title(p.getName())
                    .subtitle(p.getStatus() == null ? null : p.getStatus().name())
                    .snippet(snippet(p.getDescription(), q))
                    .build());
        }

        List<SearchResponseDTO.Item> tasks = new ArrayList<>();
        for (Task t : taskRepository.searchTasks(q, page)) {
            tasks.add(SearchResponseDTO.Item.builder()
                    .type("task").id(t.getId()).title(t.getName())
                    .subtitle(t.getProject() == null ? null : t.getProject().getName())
                    .snippet(snippet(t.getDescription(), q))
                    .build());
        }

        List<SearchResponseDTO.Item> wiki = new ArrayList<>();
        for (WikiPage w : wikiPageRepository.searchWikiPages(q, page)) {
            wiki.add(SearchResponseDTO.Item.builder()
                    .type("wiki").id(w.getId()).title(w.getTitle())
                    .snippet(snippet(w.getContent(), q))
                    .build());
        }

        return SearchResponseDTO.builder()
                .query(q)
                .total(projects.size() + tasks.size() + wiki.size())
                .projects(projects).tasks(tasks).wiki(wiki)
                .build();
    }

    /**
     * Build a short, single-line excerpt centred on the first match of {@code q}, stripping newlines
     * and collapsing whitespace so Markdown bodies render cleanly in the dropdown.
     */
    private String snippet(String text, String q) {
        if (text == null || text.isBlank()) return null;
        String flat = text.replaceAll("\\s+", " ").trim();
        int idx = flat.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) {
            return flat.length() <= SNIPPET_LEN ? flat : flat.substring(0, SNIPPET_LEN) + "…";
        }
        int start = Math.max(0, idx - 40);
        int end = Math.min(flat.length(), start + SNIPPET_LEN);
        String s = flat.substring(start, end);
        if (start > 0) s = "…" + s;
        if (end < flat.length()) s = s + "…";
        return s;
    }
}
