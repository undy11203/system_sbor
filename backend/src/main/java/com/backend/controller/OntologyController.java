package com.backend.controller;

import com.backend.service.OntologyService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Provides form field definitions derived from the OWL ontology.
 *
 * Endpoints:
 *   GET /api/ontology/fields/student?degree=Бакалавриат   — student (Бакалавриат/Магистратура)
 *   GET /api/ontology/fields/supervisor/ngu               — Руководитель_от_НГУ
 *   GET /api/ontology/fields/supervisor/org               — Руководитель_от_организации
 */
@RestController
@RequestMapping("/api/ontology")
public class OntologyController {

    private final OntologyService ontologyService;

    @Value("${ontology.base-namespace}")
    private String ns;

    public OntologyController(OntologyService ontologyService) {
        this.ontologyService = ontologyService;
    }

    /**
     * GET /api/ontology/individuals?classUri=...&search=...
     * Returns up to 10 individuals of the given class whose ФИО contains the search string.
     * Used for autocomplete suggestions on ObjectProperty fields.
     */
    @GetMapping("/individuals")
    public ResponseEntity<List<Map<String, String>>> searchIndividuals(
            @RequestParam String classUri,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(ontologyService.searchIndividuals(classUri, search));
    }

    /**
     * GET /api/ontology/property-values?propUri=...&search=...
     * Returns up to 10 existing literal values of a DatatypeProperty matching the search string.
     * Used for autocomplete suggestions on DatatypeProperty fields.
     */
    @GetMapping("/property-values")
    public ResponseEntity<List<Map<String, String>>> searchPropertyValues(
            @RequestParam String propUri,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(ontologyService.searchPropertyValues(propUri, search));
    }
}
