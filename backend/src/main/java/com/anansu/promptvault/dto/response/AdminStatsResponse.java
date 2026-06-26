package com.anansu.promptvault.dto.response;

public record AdminStatsResponse(
        long userCount,
        long promptCount,
        long flaggedCount,
        long keywordCount
) {}
