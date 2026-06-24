package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.dto.PlanInfoDTO;
import com.example.gpiApp.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Subscription plan & usage for the caller's organization (admin-only). */
@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
@PreAuthorize("@perm.has('billing.manage')")   // any role granted billing.manage (admins are super-users)
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<PlanInfoDTO> current() {
        return ResponseEntity.ok(planService.currentPlan());
    }

    @PostMapping("/change")
    public ResponseEntity<ApiResponse<PlanInfoDTO>> change(@RequestBody Map<String, String> body) {
        planService.changePlan(body.get("plan"));
        return ResponseEntity.ok(ApiResponse.success("Plan updated", planService.currentPlan()));
    }
}
