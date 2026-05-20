package com.backend.service;

import com.backend.entity.StudentSubmission;
import com.backend.repository.SettingsRepository;
import com.backend.repository.StudentSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Polls DB every hour and sends reminders to students who haven't submitted documents.
 * Sends up to 3 reminders: at deadline-14d, deadline-7d, deadline-3d.
 * Stops when status becomes RECEIVED or deadline has passed.
 */
@Service
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);
    private static final String DEADLINE_KEY = "submission_deadline";
    private static final int[] DAYS_BEFORE = {14, 7, 3};

    private final StudentSubmissionRepository submissionRepo;
    private final SettingsRepository settingsRepo;
    private final EmailService emailService;

    public ReminderScheduler(StudentSubmissionRepository submissionRepo,
                             SettingsRepository settingsRepo,
                             EmailService emailService) {
        this.submissionRepo = submissionRepo;
        this.settingsRepo = settingsRepo;
        this.emailService = emailService;
    }

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void sendPendingReminders() {
        LocalDate deadline = getDeadline();
        if (deadline == null) {
            log.debug("Reminder scheduler: deadline not set, skipping");
            return;
        }

        Instant now = Instant.now();
        Instant deadlineInstant = deadline.atStartOfDay(ZoneOffset.UTC).toInstant();

        if (now.isAfter(deadlineInstant)) {
            log.debug("Reminder scheduler: deadline has passed, skipping");
            return;
        }

        List<StudentSubmission> pending = submissionRepo.findByStatus(StudentSubmission.Status.PENDING);
        for (StudentSubmission sub : pending) {
            int sent = sub.getRemindersSent();
            if (sent >= DAYS_BEFORE.length) continue;

            Instant reminderTime = deadline.minusDays(DAYS_BEFORE[sent])
                    .atStartOfDay(ZoneOffset.UTC).toInstant();

            if (now.isAfter(reminderTime)) {
                try {
                    emailService.sendReminder(sub.getEmail(), sent + 1, deadline);
                    sub.incrementRemindersSent();
                    submissionRepo.save(sub);
                    log.info("Reminder #{} sent to {}", sent + 1, sub.getEmail());
                } catch (Exception e) {
                    log.error("Failed to send reminder #{} to {}: {}", sent + 1, sub.getEmail(), e.getMessage());
                }
            }
        }
    }

    private LocalDate getDeadline() {
        return settingsRepo.findById(DEADLINE_KEY)
                .map(s -> LocalDate.parse(s.getValue()))
                .orElse(null);
    }
}
