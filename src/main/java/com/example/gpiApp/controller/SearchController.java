package com.example.gpiApp.controller;

import com.example.gpiApp.dto.SearchResponseDTO;
import com.example.gpiApp.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Global search endpoint. Any authenticated tenant member may search; results are org-scoped by the
 * tenant filter in {@link SearchService}. Returns a raw grouped payload (no ApiResponse envelope) so
 * the frontend can bind directly, matching the ApiService convention used by the header search.
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResponseDTO> search(@RequestParam("q") String q,
                                                    @RequestParam(value = "limit", required = false) Integer limit) {
        return ResponseEntity.ok(searchService.search(q, limit));
    }
}
