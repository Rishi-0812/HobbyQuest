package com.example.hobbyquest_backend.feedback;

import com.example.hobbyquest_backend.user.FeedbackRequest;
import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

	private final FeedbackService feedbackService;

	@PostMapping
	public ResponseEntity<?> submitFeedback(
			@AuthenticationPrincipal User currentUser,
			@RequestBody FeedbackRequest request
	) {
		try {
			FeedbackReport saved = feedbackService.submit(
					currentUser.getId(),
					request.getType(),
					request.getHobbyName(),
					request.getMessage(),
					request.getImageUrl()
			);
			return ResponseEntity.status(HttpStatus.CREATED).body(saved);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}

	@GetMapping("/suggestions")
	public ResponseEntity<?> suggestions(@AuthenticationPrincipal User currentUser) {
		return ResponseEntity.ok(feedbackService.getSuggestionsBoard(currentUser.getId()));
	}

	@PostMapping("/{id}/vote")
	public ResponseEntity<?> vote(
			@AuthenticationPrincipal User currentUser,
			@PathVariable Long id
	) {
		try {
			return ResponseEntity.ok(feedbackService.toggleVote(currentUser.getId(), id));
		} catch (NoSuchElementException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}
}
