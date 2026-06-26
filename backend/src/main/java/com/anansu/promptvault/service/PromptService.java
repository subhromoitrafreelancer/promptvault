package com.anansu.promptvault.service;

import com.anansu.promptvault.dto.request.PromptRequest;
import com.anansu.promptvault.dto.response.HistoryResponse;
import com.anansu.promptvault.dto.response.PageResponse;
import com.anansu.promptvault.dto.response.PromptResponse;
import com.anansu.promptvault.dto.response.SubmitResponse;
import com.anansu.promptvault.exception.ForbiddenException;
import com.anansu.promptvault.exception.ResourceNotFoundException;
import com.anansu.promptvault.model.Category;
import com.anansu.promptvault.model.Prompt;
import com.anansu.promptvault.model.SubmissionHistory;
import com.anansu.promptvault.model.User;
import com.anansu.promptvault.repository.CategoryRepository;
import com.anansu.promptvault.repository.PromptRepository;
import com.anansu.promptvault.repository.SubmissionHistoryRepository;
import com.anansu.promptvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PromptService {

    private final PromptRepository promptRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SubmissionHistoryRepository historyRepository;
    private final PolicyService policyService;
    private final AIService aiService;

    @Transactional(readOnly = true)
    public PageResponse<PromptResponse> getMyPrompts(String username, Pageable pageable) {
        User user = loadUser(username);
        return PageResponse.from(
                promptRepository.findByUser(user, pageable).map(PromptResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public PromptResponse getById(Long id, String username) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prompt not found: " + id));
        boolean isOwner  = prompt.getUser().getUsername().equals(username);
        boolean isPublic = "PUBLIC".equals(prompt.getVisibility());
        if (!isOwner && !isPublic) {
            throw new ForbiddenException("This prompt is private");
        }
        return PromptResponse.from(prompt);
    }

    @Transactional
    public PromptResponse create(String username, PromptRequest req) {
        User user = loadUser(username);
        Category category = resolveCategory(req.categoryId());

        Prompt prompt = Prompt.builder()
                .title(req.title())
                .body(req.body())
                .category(category)
                .user(user)
                .visibility(req.visibility() != null ? req.visibility() : "PRIVATE")
                .flagged(false)
                .build();

        promptRepository.save(prompt);
        List<String> matched = policyService.applyFlags(prompt);
        promptRepository.save(prompt);

        return PromptResponse.from(prompt, matched);
    }

    @Transactional
    public PromptResponse update(Long id, String username, PromptRequest req) {
        Prompt prompt = loadOwnedPrompt(id, username);
        Category category = resolveCategory(req.categoryId());

        prompt.setTitle(req.title());
        prompt.setBody(req.body());
        prompt.setCategory(category);
        if (req.visibility() != null) prompt.setVisibility(req.visibility());

        List<String> matched = policyService.applyFlags(prompt);
        promptRepository.save(prompt);

        return PromptResponse.from(prompt, matched);
    }

    @Transactional
    public void delete(Long id, String username) {
        Prompt prompt = loadOwnedPrompt(id, username);
        promptRepository.delete(prompt);
    }

    @Transactional(readOnly = true)
    public PageResponse<PromptResponse> getShared(Pageable pageable) {
        return PageResponse.from(
                promptRepository.findByVisibility("PUBLIC", pageable).map(PromptResponse::from)
        );
    }

    @Transactional
    public SubmitResponse submit(Long id, String username) {
        Prompt prompt = loadOwnedPrompt(id, username);
        User user = loadUser(username);

        List<String> matched = policyService.applyFlags(prompt);
        promptRepository.save(prompt);

        String aiResponse = aiService.simulate(prompt.getTitle());
        SubmissionHistory history = SubmissionHistory.builder()
                .prompt(prompt)
                .user(user)
                .aiResponse(aiResponse)
                .build();
        historyRepository.save(history);

        return new SubmitResponse(history.getId(), aiResponse, prompt.isFlagged(), matched, history.getSubmittedAt());
    }

    @Transactional(readOnly = true)
    public PageResponse<HistoryResponse> getHistory(String username, Pageable pageable) {
        User user = loadUser(username);
        return PageResponse.from(
                historyRepository.findByUserOrderBySubmittedAtDesc(user, pageable).map(HistoryResponse::from)
        );
    }

    private Prompt loadOwnedPrompt(Long id, String username) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prompt not found: " + id));
        if (!prompt.getUser().getUsername().equals(username)) {
            throw new ForbiddenException("You do not own this prompt");
        }
        return prompt;
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }
}
