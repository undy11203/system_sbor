package com.backend.service;

import com.backend.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class AuthService {

    @Value("${auth.allowed-domain:g.nsu.ru}")
    private String allowedDomain;

    private final CodeStorageService codeStorage;
    private final EmailService emailService;
    private final JwtService jwtService;

    private final SecureRandom random = new SecureRandom();

    public AuthService(CodeStorageService codeStorage,
                       EmailService emailService,
                       JwtService jwtService) {
        this.codeStorage = codeStorage;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    /**
     * Validates domain, generates code, stores it and sends via email.
     * Throws IllegalArgumentException if domain is invalid.
     */
    public void sendVerificationCode(String email) {
        validateDomain(email);
        String code = generateCode();
        codeStorage.save(email, code);
        emailService.sendVerificationCode(email, code);
    }

    /**
     * Verifies the code and returns a JWT token on success.
     * Throws IllegalArgumentException if domain is invalid or code is wrong/expired.
     */
    public AuthResponse verifyCode(String email, String code) {
        validateDomain(email);

        if (!codeStorage.verify(email, code)) {
            throw new IllegalArgumentException("Неверный или истёкший код подтверждения");
        }

        codeStorage.invalidate(email);
        String token = jwtService.generateToken(email);
        return new AuthResponse(token, email);
    }

    private void validateDomain(String email) {
        if (!email.toLowerCase().endsWith("@" + allowedDomain)) {
            throw new IllegalArgumentException(
                    "Разрешены только почтовые адреса домена @" + allowedDomain);
        }
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
