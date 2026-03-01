package com.backend.controller;

import com.backend.service.DocumentFillService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * GET /api/documents?studentUri=... — returns a ZIP of filled DOCX templates for the student.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentFillService documentFillService;

    public DocumentController(DocumentFillService documentFillService) {
        this.documentFillService = documentFillService;
    }

    @GetMapping
    public ResponseEntity<byte[]> getDocuments(@RequestParam String studentUri) {
        log.info("Document generation requested for student: {}", studentUri);
        try {
            byte[] zip = documentFillService.generateZip(studentUri);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/zip"));
            headers.setContentDispositionFormData("attachment", "documents.zip");
            headers.setContentLength(zip.length);

            return ResponseEntity.ok().headers(headers).body(zip);
        } catch (IllegalArgumentException e) {
            log.warn("Student not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to generate documents for {}: {}", studentUri, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
