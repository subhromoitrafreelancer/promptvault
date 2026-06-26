package com.anansu.promptvault.dto.response;

import com.anansu.promptvault.model.FlaggedPrompt;
import java.time.LocalDateTime;

public record FlaggedPromptResponse(
        Long id,
        Long promptId,
        String promptTitle,
        String ownerUsername,
        String keyword,
        boolean promptFlagged,
        LocalDateTime flaggedAt
) {
    public static FlaggedPromptResponse from(FlaggedPrompt f) {
        return new FlaggedPromptResponse(
                f.getId(),
                f.getPrompt().getId(),
                f.getPrompt().getTitle(),
                f.getPrompt().getUser().getUsername(),
                f.getKeyword(),
                f.getPrompt().isFlagged(),
                f.getFlaggedAt()
        );
    }
}
