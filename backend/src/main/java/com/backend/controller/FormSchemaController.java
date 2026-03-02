package com.backend.controller;

import com.backend.dto.FormSchema;
import com.backend.service.FormSchemaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/forms/schema — returns the form field schema loaded from form-schema.yaml.
 */
@RestController
@RequestMapping("/api/forms")
public class FormSchemaController {

    private final FormSchemaService formSchemaService;

    public FormSchemaController(FormSchemaService formSchemaService) {
        this.formSchemaService = formSchemaService;
    }

    @GetMapping("/schema")
    public ResponseEntity<FormSchema> getSchema() {
        return ResponseEntity.ok(formSchemaService.getSchema());
    }
}
