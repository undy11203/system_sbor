package com.backend.controller;

import com.backend.dto.AuthResponse;
import com.backend.dto.SendCodeRequest;
import com.backend.dto.VerifyCodeRequest;
import com.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/send-code
     * Body: { "email": "user@g.nsu.ru" }
     * Validates domain, generates 6-digit code and sends it via email.
     */
    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody @Valid SendCodeRequest request) {
        try {
            authService.sendVerificationCode(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Код отправлен на " + request.getEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (MailException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Ошибка отправки письма: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/verify
     * Body: { "email": "user@g.nsu.ru", "code": "123456" }
     * Verifies code, returns JWT token on success.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody @Valid VerifyCodeRequest request) {
        try {
            AuthResponse response = authService.verifyCode(request.getEmail(), request.getCode());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
