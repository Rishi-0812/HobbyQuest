package com.example.hobbyquest_backend.reminder;

import com.example.hobbyquest_backend.auth.EmailService;
import com.example.hobbyquest_backend.session.SessionLogRepository;
import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderEmailJob {

    private final UserRepository userRepository;
    private final SessionLogRepository sessionLogRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 * * * *")
    public void sendDailyReminders() {
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        LocalDate today = nowUtc.toLocalDate();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
        int currentHourUtc = nowUtc.getHour();

        List<User> users = userRepository.findByDailyReminderEnabledTrueAndReminderHourUtc(currentHourUtc);
        for (User user : users) {
            if (sessionLogRepository.hasSessionBetween(user.getId(), startOfDay, startOfNextDay)) {
                continue;
            }

            try {
                emailService.sendDailyReminderEmail(user.getEmail(), user.getName());
            } catch (RuntimeException exception) {
                log.warn("Could not send daily reminder email to user {}", user.getId(), exception);
            }
        }
    }
}
