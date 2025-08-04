package com.example.gpiApp.entity;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

class TaskCategoryTest {

    @Test
    void testTaskCategoryCreation() {
        // Given
        TaskCategory category = TaskCategory.builder()
                .categoryId(UUID.randomUUID())
                .categoryName("Development")
                .description("Software development tasks")
                .colorCode("#007bff")
                .isActive(true)
                .build();

        // When & Then
        assertNotNull(category);
        assertEquals("Development", category.getCategoryName());
        assertEquals("Software development tasks", category.getDescription());
        assertEquals("#007bff", category.getColorCode());
        assertTrue(category.getIsActive());
    }

    @Test
    void testTaskCategorySettersAndGetters() {
        // Given
        TaskCategory category = new TaskCategory();

        // When
        category.setCategoryName("Testing");
        category.setDescription("Quality assurance tasks");
        category.setColorCode("#28a745");
        category.setIsActive(false);

        // Then
        assertEquals("Testing", category.getCategoryName());
        assertEquals("Quality assurance tasks", category.getDescription());
        assertEquals("#28a745", category.getColorCode());
        assertFalse(category.getIsActive());
    }

    @Test
    void testTaskCategoryDefaultValues() {
        // Given
        TaskCategory category = new TaskCategory();

        // When & Then
        assertTrue(category.getIsActive()); // Default value should be true
    }
} 