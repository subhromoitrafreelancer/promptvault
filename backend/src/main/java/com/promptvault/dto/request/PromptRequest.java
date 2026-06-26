package com.promptvault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PromptRequest(
        @NotBlank String title,
        @NotBlank String body,
        Long categoryId,
        @Pattern(regexp = "PUBLIC|PRIVATE") String visibility
) {}
