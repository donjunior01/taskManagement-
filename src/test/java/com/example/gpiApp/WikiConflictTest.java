package com.example.gpiApp;

import com.example.gpiApp.entity.WikiPage;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.exception.ConflictException;
import com.example.gpiApp.repository.WikiPageRepository;
import com.example.gpiApp.service.WikiService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Optimistic-concurrency guard on wiki edits: a stale save is rejected, a current one goes through. */
@ExtendWith(MockitoExtension.class)
class WikiConflictTest {

    @Mock WikiPageRepository repository;
    @InjectMocks WikiService service;

    private WikiPage stored(LocalDateTime updatedAt) {
        WikiPage p = new WikiPage();
        p.setId(1L); p.setTitle("Runbook"); p.setContent("v2"); p.setUpdatedAt(updatedAt);
        p.setUpdatedByName("Bob");
        return p;
    }

    @Test
    void rejectsSaveWhenPageChangedSinceOpened() {
        LocalDateTime now = LocalDateTime.now();
        when(repository.findById(1L)).thenReturn(Optional.of(stored(now)));

        WikiPage patch = new WikiPage();
        patch.setContent("my edit");
        patch.setUpdatedAt(now.minusMinutes(5)); // baseline older than stored → conflict

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.update(1L, patch, null));
        assertTrue(ex.getMessage().contains("Bob"));
        verify(repository, never()).save(any());
    }

    @Test
    void allowsSaveWhenBaselineMatchesStored() {
        LocalDateTime now = LocalDateTime.now();
        when(repository.findById(1L)).thenReturn(Optional.of(stored(now)));
        when(repository.save(any())).thenAnswer(a -> a.getArgument(0));

        WikiPage patch = new WikiPage();
        patch.setContent("my edit");
        patch.setUpdatedAt(now); // same baseline → no conflict

        WikiPage result = service.update(1L, patch, null);

        assertEquals("my edit", result.getContent());
        verify(repository).save(any());
    }

    @Test
    void allowsSaveWhenClientSendsNoBaseline() {
        when(repository.findById(1L)).thenReturn(Optional.of(stored(LocalDateTime.now())));
        when(repository.save(any())).thenAnswer(a -> a.getArgument(0));

        WikiPage patch = new WikiPage();
        patch.setContent("legacy client");
        patch.setUpdatedAt(null); // no optimistic token → allowed (backward compatible)

        assertDoesNotThrow(() -> service.update(1L, patch, null));
        verify(repository).save(any());
    }
}
