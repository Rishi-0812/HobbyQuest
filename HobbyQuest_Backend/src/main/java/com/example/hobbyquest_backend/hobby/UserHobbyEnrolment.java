package com.example.hobbyquest_backend.hobby;

import com.example.hobbyquest_backend.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_hobby_enrolments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "hobby_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserHobbyEnrolment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "hobby_id", nullable = false)
    private Hobby hobby;

    @Column(name = "enrolled_at")
    @Builder.Default
    private LocalDateTime enrolledAt = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE | UNENROLLED
}