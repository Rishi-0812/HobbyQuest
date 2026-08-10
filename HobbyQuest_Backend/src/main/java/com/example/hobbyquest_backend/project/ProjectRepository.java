package com.example.hobbyquest_backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByHobbyId(Long hobbyId);

    @Query("""
        SELECT p FROM Project p
        WHERE p.hobbyId = :hobbyId
          AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))
        """)
    List<Project> findSimilarByHobbyAndName(@Param("hobbyId") Long hobbyId, @Param("name") String name);
}
