package com.anansu.promptvault.controller;

import com.anansu.promptvault.dto.request.PromptRequest;
import com.anansu.promptvault.dto.request.ScanRequest;
import com.anansu.promptvault.dto.response.*;
import com.anansu.promptvault.service.PolicyService;
import com.anansu.promptvault.service.PromptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptController {

    private final PromptService promptService;
    private final PolicyService policyService;

    @GetMapping("/mine")
    public ResponseEntity<PageResponse<PromptResponse>> myPrompts(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(promptService.getMyPrompts(principal.getUsername(), pageable));
    }

    @PostMapping
    public ResponseEntity<PromptResponse> create(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody @Valid PromptRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(promptService.create(principal.getUsername(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromptResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody @Valid PromptRequest req) {
        return ResponseEntity.ok(promptService.update(id, principal.getUsername(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        promptService.delete(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromptResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(promptService.getById(id, principal.getUsername()));
    }

    @GetMapping("/shared")
    public ResponseEntity<PageResponse<PromptResponse>> shared(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(promptService.getShared(pageable));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmitResponse> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(promptService.submit(id, principal.getUsername()));
    }

    @GetMapping("/history")
    public ResponseEntity<PageResponse<HistoryResponse>> history(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(promptService.getHistory(principal.getUsername(), pageable));
    }

    @PostMapping("/scan")
    public ResponseEntity<ScanResponse> scan(@RequestBody @Valid ScanRequest req) {
        var matched = policyService.scan(req.body());
        return ResponseEntity.ok(new ScanResponse(matched, !matched.isEmpty()));
    }
}
