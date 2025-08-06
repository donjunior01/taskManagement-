package com.example.gpiApp.config;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.TaskCategory;
import com.example.gpiApp.entity.TaskPriority;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.TaskCategoryRepository;
import com.example.gpiApp.repository.TaskPriorityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Random;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final TaskCategoryRepository taskCategoryRepository;
    private final TaskPriorityRepository taskPriorityRepository;
    private final PasswordEncoder passwordEncoder;

    Random random = new Random();
    Long randomLong = random.nextLong();
    
    @Override
    public void run(String... args) throws Exception {
        log.info("Loading initial data...");
        
        // Load users if none exist
        if (userRepository.count() == 0) {
            loadUsers();
        }
        
        // Load task categories if none exist
        if (taskCategoryRepository.count() == 0) {
            loadTaskCategories();
        }
        
        // Load task priorities if none exist
        if (taskPriorityRepository.count() == 0) {
            loadTaskPriorities();
        }
        
        log.info("Initial data loading completed.");
    }
    
    private void loadUsers() {
        log.info("Loading users...");
        
        allUsers admin = allUsers.builder()
                .userId(randomLong)
                .email("admin@company.com")
                .passwordHash(passwordEncoder.encode("password"))
                .firstName("John")
                .lastName("Admin")
                .phone("+1234567890")
                .userRole(allUsers.UserRole.SUPER_ADMIN)
                .userPost(allUsers.UserPost.OPERATIONS_MANAGER)
                .isActive(true)
                .build();
        
        allUsers manager = allUsers.builder()
                .userId(randomLong)
                .email("manager@company.com")
                .passwordHash(passwordEncoder.encode("password"))
                .firstName("Sarah")
                .lastName("Manager")
                .phone("+1234567891")
                .userRole(allUsers.UserRole.MANAGER)
                .userPost(allUsers.UserPost.PROJECT_MANAGER)
                .isActive(true)
                .build();
        
        allUsers employee = allUsers.builder()
                .userId(randomLong)
                .email("employee@company.com")
                .passwordHash(passwordEncoder.encode("password"))
                .firstName("Alice")
                .lastName("Developer")
                .phone("+1234567892")
                .userRole(allUsers.UserRole.EMPLOYEE)
                .userPost(allUsers.UserPost.DEVELOPER)
                .isActive(true)
                .build();
        
        userRepository.saveAll(Arrays.asList(admin, manager, employee));
        log.info("Users loaded successfully.");
    }
    
    private void loadTaskCategories() {
        log.info("Loading task categories...");
        
        TaskCategory development = TaskCategory.builder()
                .categoryId(randomLong)
                .categoryName("Development")
                .description("Software development tasks")
                .colorCode("#007bff")
                .isActive(true)
                .build();
        
        TaskCategory design = TaskCategory.builder()
                .categoryId(randomLong)
                .categoryName("Design")
                .description("UI/UX design tasks")
                .colorCode("#28a745")
                .isActive(true)
                .build();
        
        TaskCategory testing = TaskCategory.builder()
                .categoryId(randomLong)
                .categoryName("Testing")
                .description("Quality assurance tasks")
                .colorCode("#ffc107")
                .isActive(true)
                .build();
        
        TaskCategory documentation = TaskCategory.builder()
                .categoryId(randomLong)
                .categoryName("Documentation")
                .description("Documentation tasks")
                .colorCode("#17a2b8")
                .isActive(true)
                .build();
        
        TaskCategory meeting = TaskCategory.builder()
                .categoryId(randomLong)
                .categoryName("Meeting")
                .description("Meeting and coordination tasks")
                .colorCode("#6f42c1")
                .isActive(true)
                .build();
        
        taskCategoryRepository.saveAll(Arrays.asList(development, design, testing, documentation, meeting));
        log.info("Task categories loaded successfully.");
    }
    
    private void loadTaskPriorities() {
        log.info("Loading task priorities...");
        
        TaskPriority low = TaskPriority.builder()
                .priorityId(randomLong)
                .priorityName("Low")
                .priorityLevel(1)
                .colorCode("#6c757d")
                .isActive(true)
                .build();
        
        TaskPriority medium = TaskPriority.builder()
                .priorityId(randomLong)
                .priorityName("Medium")
                .priorityLevel(2)
                .colorCode("#ffc107")
                .isActive(true)
                .build();
        
        TaskPriority high = TaskPriority.builder()
                .priorityId(randomLong)
                .priorityName("High")
                .priorityLevel(3)
                .colorCode("#fd7e14")
                .isActive(true)
                .build();
        
        TaskPriority critical = TaskPriority.builder()
                .priorityId(randomLong)
                .priorityName("Critical")
                .priorityLevel(4)
                .colorCode("#dc3545")
                .isActive(true)
                .build();
        
        taskPriorityRepository.saveAll(Arrays.asList(low, medium, high, critical));
        log.info("Task priorities loaded successfully.");
    }
} 