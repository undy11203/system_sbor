package com.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "student_submissions")
public class StudentSubmission {

    @Id
    @Column(nullable = false)
    private String studentUri;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant receivedAt;

    public enum Status { PENDING, RECEIVED }

    public StudentSubmission() {}

    public StudentSubmission(String studentUri, String email) {
        this.studentUri = studentUri;
        this.email = email;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
    }

    public String getStudentUri() { return studentUri; }
    public String getEmail() { return email; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReceivedAt() { return receivedAt; }

    public void markReceived() {
        this.status = Status.RECEIVED;
        this.receivedAt = Instant.now();
    }
}
