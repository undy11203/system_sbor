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
 *   GET /api/ontology/fields/supervisor/vkr               — Руководитель_ВКР
 *   GET /api/ontology/fields/supervisor/ngu               — Руководитель_от_НГУ
 *   GET /api/ontology/fields/supervisor/org               — Руководитель_от_организации
 *   GET /api/ontology/fields/vkr                          — ВКР (topic)
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

    @GetMapping("/fields/student")
    public ResponseEntity<List<Map<String, String>>> getStudentFields(
            @RequestParam(defaultValue = "Бакалавриат") String degree) {
        return ResponseEntity.ok(ontologyService.getFormFields(ns + degree));
    }

    @GetMapping("/fields/supervisor/vkr")
    public ResponseEntity<List<Map<String, String>>> getSupervisorVkrFields() {
        return ResponseEntity.ok(ontologyService.getFormFields(ns + "Руководитель_ВКР"));
    }

    @GetMapping("/fields/supervisor/ngu")
    public ResponseEntity<List<Map<String, String>>> getSupervisorNguFields() {
        return ResponseEntity.ok(ontologyService.getFormFields(ns + "Руководитель_от_НГУ"));
    }

    @GetMapping("/fields/supervisor/org")
    public ResponseEntity<List<Map<String, String>>> getSupervisorOrgFields() {
        return ResponseEntity.ok(ontologyService.getFormFields(ns + "Руководитель_от_организации"));
    }

    @GetMapping("/fields/vkr")
    public ResponseEntity<List<Map<String, String>>> getVkrFields() {
        // Uses schema-based (rdfs:domain) discovery so fields appear even without existing ВКР instances.
        return ResponseEntity.ok(ontologyService.getVkrFormFields());
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
