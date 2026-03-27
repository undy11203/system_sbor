package com.backend.service;

import com.backend.dto.AuthResponse;
import com.backend.model.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Value("${auth.allowed-domain:g.nsu.ru}")
    private String allowedDomain;

    @Value("${auth.secretary-emails:}")
    private String secretaryEmailsRaw;

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

    public void sendVerificationCode(String email) {
        validateAccess(email);
        String code = generateCode();
        codeStorage.save(email, code);
        emailService.sendVerificationCode(email, code);
    }

    public AuthResponse verifyCode(String email, String code) {
        validateAccess(email);

        if (!codeStorage.verify(email, code)) {
            throw new IllegalArgumentException("Неверный или истёкший код подтверждения");
        }

        codeStorage.invalidate(email);
        Role role = resolveRole(email);
        String token = jwtService.generateToken(email, role);
        return new AuthResponse(token, email, role.name());
    }

    private Role resolveRole(String email) {
        Set<String> secretaries = Arrays.stream(secretaryEmailsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
        return secretaries.contains(email.toLowerCase()) ? Role.SECRETARY : Role.STUDENT;
    }

    private void validateAccess(String email) {
        Role role = resolveRole(email);
        if (role == Role.SECRETARY) return;
        if (!email.toLowerCase().endsWith("@" + allowedDomain)) {
            throw new IllegalArgumentException(
                    "Разрешены только почтовые адреса домена @" + allowedDomain);
        }
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
