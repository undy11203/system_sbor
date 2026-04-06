package com.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "verification_codes")
public class VerificationCode {

    @Id
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private Instant expiresAt;

    public VerificationCode() {}

    public VerificationCode(String email, String code, Instant expiresAt) {
        this.email = email;
        this.code = code;
        this.expiresAt = expiresAt;
    }

    public String getEmail() { return email; }
    public String getCode() { return code; }
    public Instant getExpiresAt() { return expiresAt; }
}
