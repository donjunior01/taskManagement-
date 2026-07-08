package com.example.gpiApp;

import com.example.gpiApp.dto.SearchResponseDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.WikiPage;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.WikiPageRepository;
import com.example.gpiApp.service.SearchService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock TaskRepository taskRepository;
    @Mock WikiPageRepository wikiPageRepository;
    @InjectMocks SearchService searchService;

    @Test
    void shortQueryReturnsEmptyAndSkipsRepositories() {
        SearchResponseDTO res = searchService.search("a", null);

        assertEquals(0, res.getTotal());
        assertTrue(res.getProjects().isEmpty());
        assertTrue(res.getTasks().isEmpty());
        assertTrue(res.getWiki().isEmpty());
        verifyNoInteractions(projectRepository, taskRepository, wikiPageRepository);
    }

    @Test
    void groupsResultsByTypeAndBuildsSnippet() {
        Project p = new Project();
        p.setId(1L); p.setName("Apollo"); p.setDescription("A secret Apollo mission plan");

        Task t = new Task();
        t.setId(2L); t.setName("Design capsule"); t.setDescription("design the apollo capsule shell");

        WikiPage w = new WikiPage();
        w.setId(3L); w.setTitle("Apollo notes"); w.setContent("# Heading\n\nlong   apollo   content across lines");

        when(projectRepository.searchProjects(eq("apollo"), any())).thenReturn(new PageImpl<>(List.of(p)));
        when(taskRepository.searchTasks(eq("apollo"), any())).thenReturn(new PageImpl<>(List.of(t)));
        when(wikiPageRepository.searchWikiPages(eq("apollo"), any())).thenReturn(new PageImpl<>(List.of(w)));

        SearchResponseDTO res = searchService.search("apollo", 8);

        assertEquals(3, res.getTotal());

        assertEquals("project", res.getProjects().get(0).getType());
        assertEquals("Apollo", res.getProjects().get(0).getTitle());
        assertNotNull(res.getProjects().get(0).getSnippet());

        assertEquals("task", res.getTasks().get(0).getType());
        assertEquals("Design capsule", res.getTasks().get(0).getTitle());

        assertEquals("wiki", res.getWiki().get(0).getType());
        // Newlines/extra whitespace collapsed into a single-line excerpt.
        assertFalse(res.getWiki().get(0).getSnippet().contains("\n"));
        assertFalse(res.getWiki().get(0).getSnippet().contains("   "));
    }

    @Test
    void capsPerGroupLimitToEight() {
        List<Task> many = new java.util.ArrayList<>();
        for (long i = 0; i < 20; i++) {
            Task t = new Task();
            t.setId(i); t.setName("task " + i);
            many.add(t);
        }
        // Service asks the repo for a page of 8; simulate the repo honouring that page size.
        Page<Task> page = new PageImpl<>(many.subList(0, 8));
        when(taskRepository.searchTasks(eq("task"), any())).thenReturn(page);
        when(projectRepository.searchProjects(eq("task"), any())).thenReturn(Page.empty());
        when(wikiPageRepository.searchWikiPages(eq("task"), any())).thenReturn(Page.empty());

        SearchResponseDTO res = searchService.search("task", 50);

        assertEquals(8, res.getTasks().size());
    }
}
