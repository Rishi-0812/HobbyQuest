package com.example.hobbyquest_backend.skill;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    // All skills for a hobby ordered for roadmap display
    List<Skill> findByHobbyIdOrderByLevelStageAscOrderIndexAsc(Long hobbyId);

    // Skills within a specific level
    List<Skill> findByHobbyIdAndLevelStageOrderByOrderIndexAsc(Long hobbyId, String levelStage);

    // Previous skill in the unlock chain
    Optional<Skill> findByHobbyIdAndLevelStageAndOrderIndex(
            Long hobbyId, String levelStage, Integer orderIndex);
}