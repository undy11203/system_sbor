package com.backend.controller;

import com.backend.dto.FormSchema;
import com.backend.service.FormSchemaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

/**
 * GET  /api/forms/schema?type=  — get form schema
 * GET  /api/forms/types         — list all schema type keys
 * PUT  /api/forms/schema?type=  — save (overwrite) schema (SECRETARY only)
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

    @GetMapping("/types")
    public ResponseEntity<List<String>> listTypes() {
        return ResponseEntity.ok(formSchemaService.listTypes());
    }

    @PutMapping("/schema")
    public ResponseEntity<Void> saveSchema(
            @RequestParam String type,
            @RequestBody FormSchema schema) throws IOException {
        formSchemaService.saveSchema(type, schema);
        return ResponseEntity.ok().build();
    }
}
