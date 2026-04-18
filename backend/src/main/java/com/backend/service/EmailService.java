package com.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    /**
     * Отправляет ZIP-архив с заполненными документами студенту.
     */
    public void sendDocuments(String to, byte[] zipBytes) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject("Ваши документы для практики");
        helper.setText("""
                Здравствуйте!

                Ваша заявка принята. Во вложении — пакет документов для прохождения практики.

                Если у вас есть вопросы, обратитесь на кафедру.
                """);
        helper.addAttachment("documents.zip", new ByteArrayResource(zipBytes), "application/zip");
        mailSender.send(msg);
    }

    /**
     * Отправляет напоминание студенту.
     */
    public void sendReminder(String to, int attempt) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Напоминание #%d — документы для практики".formatted(attempt));
        message.setText("""
                Здравствуйте!

                Напоминание #%d: вы подали заявку на прохождение практики, но бумажное заявление ещё не поступило на кафедру.
                Пожалуйста, принесите подписанное заявление на кафедру.

                Если вы уже сдали документы — проигнорируйте это письмо.
                """.formatted(attempt));
        mailSender.send(message);
    }
}
