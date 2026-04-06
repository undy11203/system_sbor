package com.backend.controller;

import com.backend.dto.ApplicationSubmitRequest;
import com.backend.dto.ApplicationSubmitResponse;
import com.backend.dto.EntryData;
import com.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /** GET /api/applications?type=supervisor-ngu — list all entries of the given schema type. */
    @GetMapping
    public ResponseEntity<List<Map<String, String>>> list(
            @RequestParam String type) {
        return ResponseEntity.ok(applicationService.listEntries(type));
    }

    /** GET /api/applications/entry?type=supervisor-ngu&uri=... — get property values for one entry. */
    @GetMapping("/entry")
    public ResponseEntity<EntryData> getEntry(
            @RequestParam String type,
            @RequestParam String uri) {
        return ResponseEntity.ok(applicationService.getEntry(uri, type));
    }

    /** PUT /api/applications/entry?type=supervisor-ngu&uri=... — update property values for one entry. */
    @PutMapping("/entry")
    public ResponseEntity<Void> updateEntry(
            @RequestParam String type,
            @RequestParam String uri,
            @Valid @RequestBody ApplicationSubmitRequest req) {
        applicationService.updateEntry(uri, req, type);
        return ResponseEntity.ok().build();
    }
}
