package com.backend.service;

import com.backend.entity.VerificationCode;
import com.backend.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CodeStorageService {

    @Value("${auth.code.ttl-minutes:10}")
    private long ttlMinutes;

    private final VerificationCodeRepository repo;

    public CodeStorageService(VerificationCodeRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void save(String email, String code) {
        Instant expiresAt = Instant.now().plusSeconds(ttlMinutes * 60);
        repo.save(new VerificationCode(email.toLowerCase(), code, expiresAt));
    }

    @Transactional
    public boolean verify(String email, String code) {
        return repo.findById(email.toLowerCase())
                .filter(e -> Instant.now().isBefore(e.getExpiresAt()))
                .filter(e -> e.getCode().equals(code))
                .isPresent();
    }

    @Transactional
    public void invalidate(String email) {
        repo.deleteById(email.toLowerCase());
    }

    @Scheduled(fixedRate = 300_000) // каждые 5 минут
    @Transactional
    public void cleanExpired() {
        repo.deleteByExpiresAtBefore(Instant.now());
    }
}
