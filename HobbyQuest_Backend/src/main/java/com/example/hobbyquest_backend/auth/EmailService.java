package com.example.hobbyquest_backend.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("HobbyQuest — Reset your password");
        message.setText(
                "You requested a password reset.\n\n" +
                        "Your reset code is: " + resetCode + "\n\n" +
                        "This code expires in 30 minutes. If you didn't request this, you can safely ignore this email."
        );
        mailSender.send(message);
    }

    public void sendDailyReminderEmail(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("HobbyQuest — Keep your streak alive");
        message.setText(
                "Hi " + userName + ",\n\n" +
                        "You haven't logged a session today yet. Log one now to keep your streak alive!\n\n" +
                        "Keep making progress with HobbyQuest."
        );
        mailSender.send(message);
    }
}