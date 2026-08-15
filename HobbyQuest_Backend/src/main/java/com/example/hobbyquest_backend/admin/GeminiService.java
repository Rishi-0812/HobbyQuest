package com.example.hobbyquest_backend.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String model;

    public String generateRoadmap(String hobbyName, String difficulty, String extraGuidance) {
        String prompt = """
            Generate a structured hobby roadmap for "%s" (%s difficulty).
            Return ONLY valid JSON with this exact shape:
            {
              "hobbyDescription": "string",
              "tags": ["string", "string"],
              "levels": [
                {
                  "levelStage": "Basic",
                  "skills": [
                    {
                      "name": "string",
                      "description": "string",
                      "tip": "string",
                      "struggledTip": "string",
                      "orderIndex": 1
                    }
                  ]
                }
              ]
            }
            Do NOT include an xpReward field for any skill — XP values are assigned
            entirely by the backend based on level stage, never by you.
            levels must contain exactly 4 entries in this order:
            Basic (5 skills), Intermediate (5 skills), Advanced (4 skills), Mastery (3 skills).
            Do not include markdown code fences.
            Extra guidance: %s
            """.formatted(hobbyName, difficulty == null || difficulty.isBlank() ? "Beginner" : difficulty,
                extraGuidance == null ? "" : extraGuidance);
        return callGeminiAndValidateJson(prompt);
    }

    public String generateProject(String hobbyName, String concept, Integer targetCount, String unitLabel) {
        int[] range = com.example.hobbyquest_backend.project.XpTiers.validRangeForTargetCount(targetCount);
        String prompt = """
            Generate a passion project for hobby "%s".
            Concept: %s
            Target count: %d
            Unit label: %s
            Return ONLY valid JSON with this exact shape:
            {
              "description": "string",
              "suggestedUnitXp": <integer between %d and %d>,
              "units": [
                { "unitNumber": 1, "name": "string or null", "creativePrompt": "string" }
              ]
            }
            For suggestedUnitXp: choose a value ONLY within the range %d-%d (inclusive),
            based on how difficult or time-consuming one unit is. Do not choose a value
            outside this range under any circumstances — it will be rejected and clamped.
            It is okay to return only a partial units list (do NOT force all unit numbers up to target).
            Do not include markdown code fences.
            """.formatted(hobbyName, concept == null ? "" : concept, targetCount == null ? 1 : targetCount,
                unitLabel == null ? "unit" : unitLabel, range[0], range[1], range[0], range[1]);
        return callGeminiAndValidateJson(prompt);
    }

    private String callGeminiAndValidateJson(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new GeminiGenerationException("Generation failed — Gemini API key is missing.");
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent?key=" + apiKey;

            System.out.println("Gemini key loaded: " + (apiKey != null && !apiKey.isEmpty()));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{Map.of("text", prompt)})
                    }
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode node = objectMapper.readTree(response.getBody());
            JsonNode textNode = node.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new GeminiGenerationException("Generation failed — empty Gemini response.");
            }

            String cleaned = stripFences(textNode.asText());
            objectMapper.readTree(cleaned);
            return cleaned;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.out.println("Gemini HTTP error: " + e.getStatusCode());
            System.out.println("Gemini error body: " + e.getResponseBodyAsString());
            throw new GeminiGenerationException("Generation failed — try again or adjust your input.", e);
        } catch (GeminiGenerationException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace(); //this thing temporary testing
            throw new GeminiGenerationException("Generation failed — try again or adjust your input.", e);
        }
    }

    private String stripFences(String value) {
        String text = value.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "");
            text = text.replaceFirst("\\s*```$", "");
        }
        return text.trim();
    }
}
