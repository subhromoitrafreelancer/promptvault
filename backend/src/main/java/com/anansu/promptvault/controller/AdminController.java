package com.anansu.promptvault.controller;

import com.anansu.promptvault.dto.request.KeywordRequest;
import com.anansu.promptvault.dto.response.AdminStatsResponse;
import com.anansu.promptvault.dto.response.FlaggedPromptResponse;
import com.anansu.promptvault.dto.response.PageResponse;
import com.anansu.promptvault.dto.response.PromptResponse;
import com.anansu.promptvault.dto.response.UserResponse;
import com.anansu.promptvault.model.PolicyKeyword;
import com.anansu.promptvault.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/prompts/{id}")
    public ResponseEntity<PromptResponse> getPrompt(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getPromptById(id));
    }

    @PutMapping("/prompts/{id}/unflag")
    public ResponseEntity<Void> unflag(@PathVariable Long id) {
        adminService.unflagPrompt(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<UserResponse> toggleUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUser(id));
    }

    @GetMapping("/keywords")
    public ResponseEntity<PageResponse<PolicyKeyword>> keywords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("keyword").ascending());
        return ResponseEntity.ok(adminService.getKeywords(pageable));
    }

    @PostMapping("/keywords")
    public ResponseEntity<PolicyKeyword> createKeyword(@RequestBody @Valid KeywordRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createKeyword(req));
    }

    @PutMapping("/keywords/{id}")
    public ResponseEntity<PolicyKeyword> updateKeyword(@PathVariable Long id,
                                                       @RequestBody @Valid KeywordRequest req) {
        return ResponseEntity.ok(adminService.updateKeyword(id, req));
    }

    @DeleteMapping("/keywords/{id}")
    public ResponseEntity<Void> deleteKeyword(@PathVariable Long id) {
        adminService.deleteKeyword(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/flagged")
    public ResponseEntity<PageResponse<FlaggedPromptResponse>> flagged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getFlaggedPrompts(pageable));
    }
}
