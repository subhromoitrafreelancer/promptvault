package com.anansu.promptvault.dto.response;

import com.anansu.promptvault.model.Category;
import java.time.LocalDateTime;

public record CategoryResponse(Long id, String name, String description, LocalDateTime createdAt) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getCreatedAt());
    }
}
