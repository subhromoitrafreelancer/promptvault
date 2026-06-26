package com.promptvault.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ScanRequest(
        @NotBlank String body
) {}
