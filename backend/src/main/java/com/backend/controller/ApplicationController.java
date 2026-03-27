package com.backend.controller;

import com.backend.dto.ApplicationSubmitRequest;
import com.backend.dto.ApplicationSubmitResponse;
import com.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/applications — accepts a filled student form and writes it to the ontology.
 */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<ApplicationSubmitResponse> submit(
            @Valid @RequestBody ApplicationSubmitRequest req,
            @RequestParam(defaultValue = "student") String type,
            @AuthenticationPrincipal String studentEmail) {
        return ResponseEntity.ok(applicationService.submitStudent(req, type, studentEmail));
    }
}
