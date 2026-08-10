package com.example.hobbyquest_backend.passion;

import com.example.hobbyquest_backend.hobby.Hobby;
import com.example.hobbyquest_backend.hobby.HobbyRepository;
import com.example.hobbyquest_backend.hobby.HobbyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PassionProjectService {

    private final PassionProjectRepository projectRepository;
    private final HobbyRepository hobbyRepository;

    public PassionHomeResponse getHome(Long userId, Long hobbyId) {
        Hobby hobby = hobbyRepository.findById(hobbyId)
                .orElseThrow(() -> new RuntimeException("Hobby not found"));
        if (!"passion".equals(hobby.getType())) {
            throw new RuntimeException("This hobby uses a structured roadmap");
        }

        return PassionHomeResponse.builder()
                .hobby(toHobbyResponse(hobby))
                .activeProjects(projectRepository.findByUserIdAndHobbyIdAndStatusOrderByCreatedAtDesc(userId, hobbyId, "ACTIVE")
                        .stream().map(this::toResponse).toList())
                .completedProjects(projectRepository.findByUserIdAndHobbyIdAndStatusOrderByCreatedAtDesc(userId, hobbyId, "COMPLETED")
                        .stream().map(this::toResponse).toList())
                .suggestedProjects(defaultTemplates(hobby.getName()))
                .completedCount(projectRepository.countByUserIdAndHobbyIdAndStatus(userId, hobbyId, "COMPLETED"))
                .build();
    }

    @Transactional
    public ProjectResponse createProject(Long userId, Long hobbyId, ProjectRequest request) {
        Hobby hobby = hobbyRepository.findById(hobbyId)
                .orElseThrow(() -> new RuntimeException("Hobby not found"));
        if (!"passion".equals(hobby.getType())) {
            throw new RuntimeException("Projects are only for passion hobbies");
        }
        String title = request.getTitle() == null || request.getTitle().isBlank()
                ? "New " + hobby.getName() + " project"
                : request.getTitle().trim();

        PassionProject project = PassionProject.builder()
                .userId(userId)
                .hobbyId(hobbyId)
                .title(title)
                .description(request.getDescription())
                .templateKey(request.getTemplateKey())
                .coverImageUrl(request.getCoverImageUrl())
                .status("ACTIVE")
                .build();
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse completeProject(Long userId, Long projectId) {
        PassionProject project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!"COMPLETED".equals(project.getStatus())) {
            project.setStatus("COMPLETED");
            project.setCompletedAt(LocalDateTime.now());
        }
        return toResponse(projectRepository.save(project));
    }

    private ProjectResponse toResponse(PassionProject project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .hobbyId(project.getHobbyId())
                .title(project.getTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .templateKey(project.getTemplateKey())
                .coverImageUrl(project.getCoverImageUrl())
                .createdAt(project.getCreatedAt())
                .completedAt(project.getCompletedAt())
                .build();
    }

    private HobbyResponse toHobbyResponse(Hobby hobby) {
        return HobbyResponse.builder()
                .id(hobby.getId())
                .name(hobby.getName())
                .type(hobby.getType())
                .description(hobby.getDescription())
                .tags(hobby.getTags())
                .difficulty(hobby.getDifficulty())
                .emoji(hobby.getEmoji())
                .enrolled(true)
                .build();
    }

    private List<ProjectTemplateResponse> defaultTemplates(String hobbyName) {
        String name = hobbyName == null ? "creative" : hobbyName.toLowerCase(Locale.ROOT);
        if (name.contains("draw") || name.contains("sketch")) {
            return List.of(
                    template("daily-sketch", "14 daily sketches", "Build a small drawing habit with one focused sketch each day.", "14 days"),
                    template("character-sheet", "Character design sheet", "Create a complete character sheet with poses, expressions, and color notes.", "1 week"),
                    template("style-study", "Three style studies", "Recreate three references to understand line, value, and shape choices.", "10 days")
            );
        }
        if (name.contains("poem") || name.contains("poetry")) {
            return List.of(
                    template("seven-poems", "Seven poem set", "Write seven short poems around one emotional theme.", "7 days"),
                    template("form-study", "Try three forms", "Write one haiku, one sonnet-inspired piece, and one free verse poem.", "1 week"),
                    template("revision-pass", "Revision collection", "Rewrite five older poems and track what changed.", "10 days")
            );
        }
        if (name.contains("story") || name.contains("writing")) {
            return List.of(
                    template("short-story", "Finish a short story", "Draft, revise, and polish one complete short story.", "2 weeks"),
                    template("world-bible", "Worldbuilding bible", "Create the core characters, setting rules, conflict, and tone guide.", "1 week"),
                    template("flash-fiction", "Five flash pieces", "Write five tiny stories under 1000 words each.", "10 days")
            );
        }
        return List.of(
                template("starter-project", "Starter project", "Create one finished piece you can proudly look back on.", "1 week"),
                template("daily-practice", "Daily practice set", "Make seven small pieces to explore your style and process.", "7 days"),
                template("portfolio-piece", "Portfolio piece", "Plan, create, and polish one larger showcase project.", "2 weeks")
        );
    }

    private ProjectTemplateResponse template(String key, String title, String description, String duration) {
        return ProjectTemplateResponse.builder()
                .key(key)
                .title(title)
                .description(description)
                .duration(duration)
                .build();
    }
}
