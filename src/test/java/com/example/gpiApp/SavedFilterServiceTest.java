package com.example.gpiApp;

import com.example.gpiApp.entity.SavedFilter;
import com.example.gpiApp.repository.SavedFilterRepository;
import com.example.gpiApp.service.SavedFilterService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedFilterServiceTest {

    @Mock SavedFilterRepository repository;
    @InjectMocks SavedFilterService service;

    @Test
    void createStampsOwnerAndDefaultsResource() {
        when(repository.save(any())).thenAnswer(a -> a.getArgument(0));

        SavedFilter in = SavedFilter.builder().name("My high-priority view").criteria("{\"priorityFilter\":\"HIGH\"}").build();
        SavedFilter out = service.create(in, 7L);

        assertEquals(7L, out.getUserId());
        assertEquals("tasks", out.getResource());
        assertNull(out.getId());
    }

    @Test
    void createRejectsBlankName() {
        SavedFilter in = SavedFilter.builder().name("  ").build();
        assertThrows(IllegalArgumentException.class, () -> service.create(in, 1L));
        verifyNoInteractions(repository);
    }

    @Test
    void updateByNonOwnerIsDenied() {
        SavedFilter existing = SavedFilter.builder().id(1L).userId(5L).name("Theirs").build();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        assertThrows(AccessDeniedException.class,
                () -> service.update(1L, SavedFilter.builder().name("Hijack").build(), 9L));
        verify(repository, never()).save(any());
    }

    @Test
    void deleteByOwnerSucceeds() {
        SavedFilter existing = SavedFilter.builder().id(1L).userId(5L).name("Mine").build();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L, 5L);

        verify(repository).delete(existing);
    }
}
