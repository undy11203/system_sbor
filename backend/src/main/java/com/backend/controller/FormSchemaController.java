package com.backend.controller;

import com.backend.dto.FormSchema;
import com.backend.service.FormSchemaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/forms/schema?type=student|supervisor-ngu
 * Returns the form field schema for the given entity type.
 */
@RestController
@RequestMapping("/api/forms")
public class FormSchemaController {

    private final FormSchemaService formSchemaService;

    public FormSchemaController(FormSchemaService formSchemaService) {
        this.formSchemaService = formSchemaService;
    }

    @GetMapping("/schema")
    public ResponseEntity<FormSchema> getSchema(
            @RequestParam(defaultValue = "student") String type) {
        return ResponseEntity.ok(formSchemaService.getSchema(type));
    }
}
