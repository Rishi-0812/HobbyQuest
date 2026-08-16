package com.example.hobbyquest_backend.admin;

import com.example.hobbyquest_backend.community.CommunityPost;
import com.example.hobbyquest_backend.community.CommunityPostRepository;
import com.example.hobbyquest_backend.feedback.FeedbackReport;
import com.example.hobbyquest_backend.feedback.FeedbackReportRepository;
import com.example.hobbyquest_backend.hobby.Hobby;
import com.example.hobbyquest_backend.hobby.HobbyRepository;
import com.example.hobbyquest_backend.hobby.UserHobbyEnrolmentRepository;
import com.example.hobbyquest_backend.project.Project;
import com.example.hobbyquest_backend.project.ProjectRepository;
import com.example.hobbyquest_backend.project.ProjectUnit;
import com.example.hobbyquest_backend.project.ProjectUnitRepository;
import com.example.hobbyquest_backend.skill.Skill;
import com.example.hobbyquest_backend.skill.SkillRepository;
import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final HobbyRepository hobbyRepository;
    private final UserHobbyEnrolmentRepository hobbyEnrolmentRepository;
    private final FeedbackReportRepository feedbackReportRepository;
    private final CommunityPostRepository communityPostRepository;
    private final AiGeneratedContentRepository aiGeneratedContentRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ProjectUnitRepository projectUnitRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public AdminDashboardResponse getDashboardStats() {
        String mostPopularHobby = hobbyEnrolmentRepository.findMostPopularHobbyNames(PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse("No enrolments yet");

        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalStructuredHobbies(hobbyRepository.countByTypeIgnoreCase("structured"))
                .totalPassionHobbies(hobbyRepository.countByTypeIgnoreCase("passion"))
                .pendingSuggestionsCount(feedbackReportRepository.countByIsReviewedFalse())
                .pendingContentCount(aiGeneratedContentRepository.countByStatus("pending"))
                .unapprovedPostsCount(communityPostRepository.countByIsApprovedFalse())
                .mostPopularHobbyName(mostPopularHobby)
                .build();
    }

    public GenerateContentResponse generateRoadmap(GenerateRoadmapRequest req) {
        if (req.getHobbyName() == null || req.getHobbyName().isBlank()) {
            throw new IllegalArgumentException("Hobby name is required.");
        }
        String generated = geminiService.generateRoadmap(req.getHobbyName(), req.getDifficulty(), req.getExtraGuidance());

        AiGeneratedContent saved = aiGeneratedContentRepository.save(AiGeneratedContent.builder()
                .contentType("roadmap")
                .targetHobbyId(null)
                .hobbyName(req.getHobbyName().trim())
                .hobbyType("structured")
                .difficulty(req.getDifficulty())
                .rawJson(generated)
                .status("pending")
                .build());

        return GenerateContentResponse.builder()
                .id(saved.getId())
                .rawJson(saved.getRawJson())
                .build();
    }

    public GenerateContentResponse generateProject(GenerateProjectRequest req) {
        boolean isNewHobby = req.getTargetHobbyId() == null
                && req.getNewHobbyName() != null && !req.getNewHobbyName().isBlank();

        if (!isNewHobby && req.getTargetHobbyId() == null) {
            throw new IllegalArgumentException("Target hobby is required.");
        }
        if (req.getConcept() == null || req.getConcept().isBlank()) throw new IllegalArgumentException("Project concept is required.");
        if (req.getTargetCount() == null || req.getTargetCount() < 1) throw new IllegalArgumentException("Target count must be at least 1.");
        if (req.getUnitLabel() == null || req.getUnitLabel().isBlank()) throw new IllegalArgumentException("Unit label is required.");
        if (req.getDurationDays() != null && req.getDurationDays() < 1) throw new IllegalArgumentException("Duration days must be a positive integer.");

        String hobbyNameForPrompt;
        String hobbyMetaJson = null;

        if (isNewHobby) {
            hobbyNameForPrompt = req.getNewHobbyName().trim();
            hobbyMetaJson = geminiService.generateHobbyMeta(hobbyNameForPrompt, req.getNewHobbyDescription());
        } else {
            Hobby targetHobby = hobbyRepository.findById(req.getTargetHobbyId())
                    .orElseThrow(() -> new NoSuchElementException("Target hobby not found."));
            hobbyNameForPrompt = targetHobby.getName();
        }

        String generated = geminiService.generateProject(
                hobbyNameForPrompt, req.getConcept(), req.getTargetCount(), req.getUnitLabel());

        String unitLabelPlural = (req.getUnitLabelPlural() == null || req.getUnitLabelPlural().isBlank())
                ? req.getUnitLabel().trim() + "s"
                : req.getUnitLabelPlural().trim();

        // Embed the hobby-meta JSON as a field inside the project's own JSON blob,
        // rather than a separate staging row — keeps generate→review→approve as
        // one atomic unit instead of two rows that could get out of sync.
        String combinedRawJson = hobbyMetaJson == null
                ? generated
                : mergeHobbyMetaIntoProjectJson(generated, hobbyMetaJson);

        AiGeneratedContent saved = aiGeneratedContentRepository.save(AiGeneratedContent.builder()
                .contentType("project")
                .targetHobbyId(req.getTargetHobbyId()) // null when creating a new hobby
                .hobbyName(hobbyNameForPrompt)
                .hobbyType("passion")
                .rawJson(combinedRawJson)
                .status("pending")
                .projectName(hobbyNameForPrompt + " Project")
                .targetCount(req.getTargetCount())
                .unitLabel(req.getUnitLabel().trim())
                .unitLabelPlural(unitLabelPlural)
                .durationDays(req.getDurationDays())
                .build());

        return GenerateContentResponse.builder()
                .id(saved.getId())
                .rawJson(saved.getRawJson())
                .build();
    }

    private String mergeHobbyMetaIntoProjectJson(String projectJson, String hobbyMetaJson) {
        try {
            JsonNode projectNode = objectMapper.readTree(projectJson);
            JsonNode hobbyNode = objectMapper.readTree(hobbyMetaJson);
            ((com.fasterxml.jackson.databind.node.ObjectNode) projectNode).set("newHobby", hobbyNode);
            return objectMapper.writeValueAsString(projectNode);
        } catch (Exception e) {
            // If merge fails for any reason, fall back to the project JSON alone —
            // admin can still fill in hobby details manually in Review.
            return projectJson;
        }
    }

    public List<PendingContentResponse> getPendingContent(String contentTypeFilter) {
        List<AiGeneratedContent> rows;
        if (contentTypeFilter == null || contentTypeFilter.isBlank()) {
            rows = aiGeneratedContentRepository.findByStatusOrderByGeneratedAtDesc("pending");
        } else {
            rows = aiGeneratedContentRepository.findByContentTypeAndStatusOrderByGeneratedAtDesc(contentTypeFilter, "pending");
        }
        return rows.stream().map(this::toPendingContent).toList();
    }

    public PendingContentResponse getContentById(Long id) {
        AiGeneratedContent row = aiGeneratedContentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Generated content not found."));
        return toPendingContent(row);
    }

    public PendingContentResponse updateEditedContent(Long id, String editedJson) {
        AiGeneratedContent row = aiGeneratedContentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Generated content not found."));
        row.setEditedJson(editedJson);
        return toPendingContent(aiGeneratedContentRepository.save(row));
    }

    @Transactional
    public Long approveContent(Long id, Long adminUserId, String editedJson) {
        AiGeneratedContent row = aiGeneratedContentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Generated content not found."));

        if (editedJson != null && !editedJson.isBlank()) {
            row.setEditedJson(editedJson);
        }

        String payload = (row.getEditedJson() != null && !row.getEditedJson().isBlank())
                ? row.getEditedJson()
                : row.getRawJson();

        Long createdId;
        if ("roadmap".equalsIgnoreCase(row.getContentType())) {
            createdId = publishRoadmap(row, payload);
        } else if ("project".equalsIgnoreCase(row.getContentType())) {
            createdId = publishProject(row, payload, adminUserId);
        } else {
            throw new IllegalArgumentException("Unsupported content type: " + row.getContentType());
        }

        row.setStatus("approved");
        row.setReviewedBy(adminUserId);
        aiGeneratedContentRepository.save(row);
        return createdId;
    }

    public void discardContent(Long id, Long adminUserId) {
        AiGeneratedContent row = aiGeneratedContentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Generated content not found."));
        row.setStatus("discarded");
        row.setReviewedBy(adminUserId);
        aiGeneratedContentRepository.save(row);
    }

    public List<FeedbackReport> getSuggestions() {
        return feedbackReportRepository.findAllByOrderByVoteCountDesc();
    }

    public void markSuggestionReviewed(Long id) {
        FeedbackReport report = feedbackReportRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Suggestion not found."));
        report.setIsReviewed(true);
        report.setReviewedAt(java.time.LocalDateTime.now());
        feedbackReportRepository.save(report);
    }

    public List<PendingPostResponse> getPendingPosts() {
        List<CommunityPost> posts = communityPostRepository.findByIsApprovedFalseOrderByCreatedAtDesc();
        return posts.stream().map(post -> PendingPostResponse.builder()
                .id(post.getId())
                .caption(post.getCaption())
                .imageUrl(post.getImageUrl())
                .postType(post.getPostType())
                .posterName(resolveUserName(post.getUserId()))
                .hobbyName(resolveHobbyName(post.getHobbyId()))
                .createdAt(post.getCreatedAt())
                .build()).toList();
    }

    public void approvePost(Long id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found."));
        post.setIsApproved(true);
        communityPostRepository.save(post);
    }

    public void rejectPost(Long id) {
        if (!communityPostRepository.existsById(id)) {
            throw new NoSuchElementException("Post not found.");
        }
        communityPostRepository.deleteById(id);
    }

    private Long publishRoadmap(AiGeneratedContent row, String payloadJson) {
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            String description = textValue(root, "hobbyDescription");
            String emoji = textValueNullable(root, "emoji");
            String difficulty = (row.getDifficulty() == null || row.getDifficulty().isBlank())
                    ? "Beginner"
                    : row.getDifficulty();

            String[] tags = parseTags(root.path("tags"));
            Hobby hobby = hobbyRepository.save(Hobby.builder()
                    .name(row.getHobbyName())
                    .type("structured")
                    .description(description)
                    .tags(tags)
                    .difficulty(difficulty)
                    .isActive(true)
                    .emoji(emoji != null && !emoji.isBlank() ? emoji : null)
                    .build());

            JsonNode levels = root.path("levels");
            if (!levels.isArray()) throw new IllegalArgumentException("Roadmap payload must include levels array.");

            List<Skill> skills = new ArrayList<>();
            for (JsonNode level : levels) {
                String levelStage = textValue(level, "levelStage");
                JsonNode levelSkills = level.path("skills");
                if (!levelSkills.isArray()) continue;

                int index = 1;
                for (JsonNode skillNode : levelSkills) {
                    // in publishRoadmap(), replace the xpReward line inside the skill-building loop:
                    int orderIndex = skillNode.path("orderIndex").asInt(index);
                    int xpReward = xpForLevelStage(levelStage); // NEVER read from skillNode anymore
                    skills.add(Skill.builder()
                            .hobbyId(hobby.getId())
                            .name(textValue(skillNode, "name"))
                            .description(textValue(skillNode, "description"))
                            .tip(textValue(skillNode, "tip"))
                            .struggledTip(textValue(skillNode, "struggledTip"))
                            .levelStage(levelStage)
                            .orderIndex(orderIndex)
                            .xpReward(xpReward)
                            .build());

                    index++;
                }
            }
            skillRepository.saveAll(skills);
            return hobby.getId();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse roadmap JSON for approval.");
        }
    }

    private Long publishProject(AiGeneratedContent row, String payloadJson, Long adminUserId) {
        try {
            JsonNode root = objectMapper.readTree(payloadJson);

            Long targetHobbyId = row.getTargetHobbyId();

            // Create the passion hobby first if this staged content includes one —
            // same creation pattern as publishRoadmap's hobby half, just no skills.
            JsonNode newHobbyNode = root.path("newHobby");
            if (targetHobbyId == null && !newHobbyNode.isMissingNode()) {
                String description = textValueNullable(newHobbyNode, "description");
                String[] tags = parseTags(newHobbyNode.path("tags"));
                String difficulty = firstNonBlank(textValueNullable(newHobbyNode, "difficulty"), "Beginner");
                String emoji = textValueNullable(newHobbyNode, "emoji");

                Hobby hobby = hobbyRepository.save(Hobby.builder()
                        .name(row.getHobbyName())
                        .type("passion")
                        .description(description)
                        .tags(tags)
                        .difficulty(difficulty)
                        .isActive(true)
                        .emoji(emoji)
                        .build());
                targetHobbyId = hobby.getId();
            }

            if (targetHobbyId == null) {
                throw new IllegalArgumentException("Project generation is missing target hobby.");
            }

            String projectName = firstNonBlank(
                    textValueNullable(root, "projectName"),
                    row.getProjectName(),
                    row.getHobbyName() + " Project"
            );
            String description = textValueNullable(root, "description");
            Integer targetCount = intValueNullable(root, "targetCount");
            if (targetCount == null) targetCount = row.getTargetCount();
            if (targetCount == null || targetCount < 1) targetCount = 1;

            String unitLabel = firstNonBlank(textValueNullable(root, "unitLabel"), row.getUnitLabel(), "unit");
            String unitLabelPlural = firstNonBlank(textValueNullable(root, "unitLabelPlural"), row.getUnitLabelPlural(), unitLabel + "s");
            Integer durationDays = intValueNullable(root, "durationDays");
            if (durationDays == null) durationDays = row.getDurationDays();

            Integer suggestedUnitXp = intValueNullable(root, "suggestedUnitXp");
            int[] range = com.example.hobbyquest_backend.project.XpTiers.validRangeForTargetCount(targetCount);
            int unitXp = suggestedUnitXp != null
                    ? com.example.hobbyquest_backend.project.XpTiers.clamp(suggestedUnitXp, range[0], range[1])
                    : (range[0] + range[1]) / 2;

            Project project = projectRepository.save(Project.builder()
                    .hobbyId(targetHobbyId)
                    .name(projectName)
                    .description(description)
                    .targetCount(targetCount)
                    .unitLabel(unitLabel)
                    .unitLabelPlural(unitLabelPlural)
                    .source("admin")
                    .isPublic(true)
                    .createdBy(adminUserId)
                    .durationDays(durationDays)
                    .unitXp(unitXp)
                    .completionBonusXp(300)
                    .build());

            JsonNode units = root.path("units");
            if (units.isArray()) {
                int index = 1;
                for (JsonNode unit : units) {
                    Integer unitNumber = intValueNullable(unit, "unitNumber");
                    if (unitNumber == null || unitNumber < 1) unitNumber = index;
                    projectUnitRepository.save(ProjectUnit.builder()
                            .projectId(project.getId())
                            .unitNumber(unitNumber)
                            .name(textValueNullable(unit, "name"))
                            .creativePrompt(textValueNullable(unit, "creativePrompt"))
                            .build());
                    index++;
                }
            }
            return project.getId();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse project JSON for approval.");
        }
    }

    private PendingContentResponse toPendingContent(AiGeneratedContent row) {
        return PendingContentResponse.builder()
                .id(row.getId())
                .contentType(row.getContentType())
                .hobbyName(row.getHobbyName())
                .hobbyType(row.getHobbyType())
                .targetHobbyId(row.getTargetHobbyId())
                .generatedAt(row.getGeneratedAt())
                .editedJson((row.getEditedJson() == null || row.getEditedJson().isBlank()) ? row.getRawJson() : row.getEditedJson())
                .status(row.getStatus())
                .difficulty(row.getDifficulty())
                .projectName(row.getProjectName())
                .targetCount(row.getTargetCount())
                .unitLabel(row.getUnitLabel())
                .unitLabelPlural(row.getUnitLabelPlural())
                .durationDays(row.getDurationDays())
                .build();
    }

    private String[] parseTags(JsonNode tagsNode) {
        if (!tagsNode.isArray()) return new String[]{};
        List<String> tags = new ArrayList<>();
        for (JsonNode tagNode : tagsNode) {
            if (!tagNode.asText("").isBlank()) tags.add(tagNode.asText().trim());
        }
        return tags.toArray(new String[0]);
    }

    private String textValue(JsonNode node, String field) {
        String value = textValueNullable(node, field);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required field: " + field);
        }
        return value;
    }

    private String textValueNullable(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        return value.asText();
    }

    private Integer intValueNullable(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        return value.asInt();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private String resolveUserName(Long userId) {
        if (userId == null) return "Unknown";
        return userRepository.findById(userId).map(User::getName).orElse("Unknown");
    }

    private String resolveHobbyName(Long hobbyId) {
        if (hobbyId == null) return "General";
        return hobbyRepository.findById(hobbyId).map(Hobby::getName).orElse("General");
    }

    // new private helper, add anywhere in the class:
    private int xpForLevelStage(String levelStage) {
        return switch (levelStage) {
            case "Basic" -> 50;
            case "Intermediate" -> 100;
            case "Advanced" -> 150;
            case "Mastery" -> 200;
            default -> 50;
        };

    }
}
