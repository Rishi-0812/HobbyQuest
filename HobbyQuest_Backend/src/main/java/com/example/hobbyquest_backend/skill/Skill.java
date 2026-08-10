package com.example.hobbyquest_backend.skill;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skills")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hobby_id", nullable = false)
    private Long hobbyId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String tip;

    @Column(name = "struggled_tip", columnDefinition = "TEXT")
    private String struggledTip;

    @Column(name = "level_stage", length = 30)
    private String levelStage;   // "Basic" | "Intermediate" | "Advanced" | "Mastery"

    @Column(name = "order_index")
    private Integer orderIndex;  // 1-based, resets per level

    @Column(name = "xp_reward")
    @Builder.Default
    private Integer xpReward = 50;
}