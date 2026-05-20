package com.backend.controller;

import com.backend.entity.Settings;
import com.backend.entity.StudentSubmission;
import com.backend.repository.SettingsRepository;
import com.backend.repository.StudentSubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private static final String DEADLINE_KEY = "submission_deadline";

    private final StudentSubmissionRepository submissionRepo;
    private final SettingsRepository settingsRepo;

    public SubmissionController(StudentSubmissionRepository submissionRepo,
                                SettingsRepository settingsRepo) {
        this.submissionRepo = submissionRepo;
        this.settingsRepo = settingsRepo;
    }

    /** List all submissions (for secretary). */
    @GetMapping
    public List<StudentSubmission> list() {
        return submissionRepo.findAll();
    }

    /** Mark a submission as received (secretary confirms). */
    @PostMapping("/receive")
    public ResponseEntity<Void> markReceived(@RequestParam String studentUri) {
        return submissionRepo.findById(studentUri).map(sub -> {
            sub.markReceived();
            submissionRepo.save(sub);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Get submission deadline (ISO date, e.g. "2025-05-01"). */
    @GetMapping("/deadline")
    public ResponseEntity<Map<String, String>> getDeadline() {
        return settingsRepo.findById(DEADLINE_KEY)
                .map(s -> ResponseEntity.ok(Map.of("deadline", s.getValue())))
                .orElse(ResponseEntity.ok(Map.of("deadline", "")));
    }

    /** Set submission deadline (secretary only). */
    @PutMapping("/deadline")
    public ResponseEntity<Void> setDeadline(@RequestBody Map<String, String> body) {
        String date = body.get("deadline");
        if (date == null || date.isBlank()) return ResponseEntity.badRequest().build();
        Settings s = settingsRepo.findById(DEADLINE_KEY).orElse(new Settings(DEADLINE_KEY, date));
        s.setValue(date);
        settingsRepo.save(s);
        return ResponseEntity.ok().build();
    }
}
