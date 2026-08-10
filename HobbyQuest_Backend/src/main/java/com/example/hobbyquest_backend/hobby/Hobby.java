package com.example.hobbyquest_backend.hobby;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hobbies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hobby {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    // "structured" or "passion"
    @Column(nullable = false, length = 20)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Tags used by recommendation engine — e.g. {dexterity, performance, indoor}
    @Column(columnDefinition = "TEXT[]")
    @org.hibernate.annotations.Array(length = 20)
    private String[] tags;

    @Column(length = 20)
    private String difficulty; // "Beginner", "Intermediate", "Advanced"

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // Emoji shown on cards
    @Column(length = 10)
    private String emoji;
}