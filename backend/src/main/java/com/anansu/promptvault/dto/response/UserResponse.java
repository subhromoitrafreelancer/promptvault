package com.anansu.promptvault.dto.response;

import com.anansu.promptvault.model.User;
import java.time.LocalDateTime;

public record UserResponse(Long id, String username, String email, String role, boolean enabled, LocalDateTime createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole(), u.isEnabled(), u.getCreatedAt());
    }
}
