package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.AsanaImportDTO;
import com.example.gpiApp.dto.ImportResultDTO;
import com.example.gpiApp.dto.JiraImportDTO;
import com.example.gpiApp.dto.TrelloImportDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Data migration from other tools. Admins and project managers only; the new project/tasks are
 * created in the caller's organization. The frontend reads the exported file and POSTs its JSON here.
 */
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
public class ImportController {

    private final ImportService importService;
    private final UserRepository userRepository;

    private allUsers actor(Authentication auth) {
        return auth != null ? userRepository.findByEmail(auth.getName())
                .orElseGet(() -> userRepository.findByUsername(auth.getName()).orElse(null)) : null;
    }

    @PostMapping("/trello")
    public ResponseEntity<ApiResponse<ImportResultDTO>> importTrello(@RequestBody TrelloImportDTO board, Authentication auth) {
        ImportResultDTO result = importService.importTrello(board, actor(auth));
        return ResponseEntity.ok(ApiResponse.success("Import complete", result));
    }

    @PostMapping("/asana")
    public ResponseEntity<ApiResponse<ImportResultDTO>> importAsana(@RequestBody AsanaImportDTO request, Authentication auth) {
        ImportResultDTO result = importService.importAsana(request.getCsv(), request.getProjectName(), actor(auth));
        return ResponseEntity.ok(ApiResponse.success("Import complete", result));
    }

    @PostMapping("/jira")
    public ResponseEntity<ApiResponse<ImportResultDTO>> importJira(@RequestBody JiraImportDTO request, Authentication auth) {
        ImportResultDTO result = importService.importJira(request.getCsv(), request.getProjectName(), actor(auth));
        return ResponseEntity.ok(ApiResponse.success("Import complete", result));
    }
}
