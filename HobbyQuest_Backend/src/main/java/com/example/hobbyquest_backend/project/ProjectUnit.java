package com.example.hobbyquest_backend.project;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_units")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "unit_number", nullable = false)
    private Integer unitNumber;

    @Column(length = 150)
    private String name;

    @Column(name = "creative_prompt", columnDefinition = "TEXT")
    private String creativePrompt;
}
