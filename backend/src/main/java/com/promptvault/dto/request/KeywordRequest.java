package com.promptvault.dto.request;

import jakarta.validation.constraints.NotBlank;

public record KeywordRequest(
        @NotBlank String keyword
) {}
