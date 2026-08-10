package com.example.hobbyquest_backend.hobby;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HobbyRepository extends JpaRepository<Hobby, Long> {

    // Browse all active hobbies, optionally filtered by type
    List<Hobby> findByIsActiveTrue();

    List<Hobby> findByTypeAndIsActiveTrue(String type);

    long countByTypeIgnoreCase(String type);

    // Recommendation engine — PostgreSQL array overlap query
    // Returns hobbies whose tags overlap with the user's interest tags
    // Orders by number of matching tags (most relevant first)
    @Query(value = """
        SELECT h.*, 
               array_length(array(
                   SELECT unnest(h.tags) 
                   INTERSECT 
                   SELECT unnest(:userTags)
               ), 1) AS match_count
        FROM hobbies h
        WHERE h.is_active = true
          AND h.tags && CAST(:userTags AS TEXT[])
        ORDER BY match_count DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Hobby> findRecommendations(@Param("userTags") String[] userTags);

    // Same but filtered by type
    @Query(value = """
        SELECT h.*, 
               array_length(array(
                   SELECT unnest(h.tags) 
                   INTERSECT 
                   SELECT unnest(:userTags)
               ), 1) AS match_count
        FROM hobbies h
        WHERE h.is_active = true
          AND h.type = :type
          AND h.tags && CAST(:userTags AS TEXT[])
        ORDER BY match_count DESC
        LIMIT 5
        """, nativeQuery = true)
    List<Hobby> findRecommendationsByType(
            @Param("userTags") String[] userTags,
            @Param("type") String type
    );
}