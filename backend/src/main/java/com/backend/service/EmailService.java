package com.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Код подтверждения — Система генерации документов");
        message.setText("""
                Ваш код подтверждения: %s

                Код действует 10 минут.
                Если вы не запрашивали код — проигнорируйте это письмо.
                """.formatted(code));
        mailSender.send(message);
    }
}
