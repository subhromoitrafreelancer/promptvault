package com.anansu.promptvault.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record SubmitResponse(
        Long historyId,
        String aiResponse,
        boolean flagged,
        List<String> matchedKeywords,
        LocalDateTime submittedAt
) {}
