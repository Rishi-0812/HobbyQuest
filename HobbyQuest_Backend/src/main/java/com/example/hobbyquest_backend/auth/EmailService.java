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
}