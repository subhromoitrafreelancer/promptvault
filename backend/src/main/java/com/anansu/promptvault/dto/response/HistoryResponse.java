package com.anansu.promptvault.dto.response;

import com.anansu.promptvault.model.SubmissionHistory;
import java.time.LocalDateTime;

public record HistoryResponse(
        Long id,
        Long promptId,
        String promptTitle,
        String aiResponse,
        LocalDateTime submittedAt
) {
    public static HistoryResponse from(SubmissionHistory h) {
        return new HistoryResponse(
                h.getId(),
                h.getPrompt().getId(),
                h.getPrompt().getTitle(),
                h.getAiResponse(),
                h.getSubmittedAt()
        );
    }
}
