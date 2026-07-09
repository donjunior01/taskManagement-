package com.example.gpiApp;

import com.example.gpiApp.entity.DashboardLayout;
import com.example.gpiApp.repository.DashboardLayoutRepository;
import com.example.gpiApp.service.DashboardLayoutService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardLayoutServiceTest {

    @Mock DashboardLayoutRepository repository;
    @InjectMocks DashboardLayoutService service;

    @Test
    void getReturnsNullWhenNoLayoutSaved() {
        when(repository.findByUserId(7L)).thenReturn(Optional.empty());
        assertNull(service.getWidgets(7L));
    }

    @Test
    void saveCreatesLayoutForNewUser() {
        when(repository.findByUserId(7L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(a -> a.getArgument(0));

        String result = service.save(7L, "completedTasks,overdueTasks");

        ArgumentCaptor<DashboardLayout> captor = ArgumentCaptor.forClass(DashboardLayout.class);
        verify(repository).save(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertEquals("completedTasks,overdueTasks", captor.getValue().getWidgets());
        assertEquals("completedTasks,overdueTasks", result);
    }

    @Test
    void saveUpdatesExistingLayoutInPlace() {
        DashboardLayout existing = DashboardLayout.builder().id(1L).userId(7L).widgets("old").build();
        when(repository.findByUserId(7L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(a -> a.getArgument(0));

        service.save(7L, "totalTasks");

        assertEquals("totalTasks", existing.getWidgets());
        verify(repository).save(existing);
    }

    @Test
    void saveRejectsOversizedLayout() {
        String tooBig = "x".repeat(5000);
        assertThrows(IllegalArgumentException.class, () -> service.save(7L, tooBig));
        verify(repository, never()).save(any());
    }
}
