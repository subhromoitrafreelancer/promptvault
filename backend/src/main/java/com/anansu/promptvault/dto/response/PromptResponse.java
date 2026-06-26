package com.anansu.promptvault.dto.response;

import com.anansu.promptvault.model.Prompt;
import java.time.LocalDateTime;
import java.util.List;

public record PromptResponse(
        Long id,
        String title,
        String body,
        Long categoryId,
        String categoryName,
        String ownerUsername,
        String visibility,
        boolean flagged,
        List<String> matchedKeywords,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PromptResponse from(Prompt p) {
        return from(p, List.of());
    }

    public static PromptResponse from(Prompt p, List<String> matchedKeywords) {
        return new PromptResponse(
                p.getId(),
                p.getTitle(),
                p.getBody(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getUser().getUsername(),
                p.getVisibility(),
                p.isFlagged(),
                matchedKeywords,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
