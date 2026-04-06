package com.backend.repository;

import com.backend.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, String> {
    void deleteByExpiresAtBefore(Instant now);
}
