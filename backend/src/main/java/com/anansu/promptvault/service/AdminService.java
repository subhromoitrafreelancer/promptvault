package com.anansu.promptvault.service;

import com.anansu.promptvault.dto.request.KeywordRequest;
import com.anansu.promptvault.dto.response.AdminStatsResponse;
import com.anansu.promptvault.dto.response.FlaggedPromptResponse;
import com.anansu.promptvault.dto.response.PageResponse;
import com.anansu.promptvault.dto.response.PromptResponse;
import com.anansu.promptvault.dto.response.UserResponse;
import com.anansu.promptvault.exception.ConflictException;
import com.anansu.promptvault.exception.ResourceNotFoundException;
import com.anansu.promptvault.model.PolicyKeyword;
import com.anansu.promptvault.model.Prompt;
import com.anansu.promptvault.model.User;
import com.anansu.promptvault.repository.FlaggedPromptRepository;
import com.anansu.promptvault.repository.PolicyKeywordRepository;
import com.anansu.promptvault.repository.PromptRepository;
import com.anansu.promptvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PromptRepository promptRepository;
    private final PolicyKeywordRepository keywordRepository;
    private final FlaggedPromptRepository flaggedPromptRepository;

    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                userRepository.count(),
                promptRepository.count(),
                promptRepository.countByFlaggedTrue(),
                keywordRepository.count()
        );
    }

    @Transactional
    public void unflagPrompt(Long promptId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new ResourceNotFoundException("Prompt not found: " + promptId));
        prompt.setFlagged(false);
        promptRepository.save(prompt);
    }

    @Transactional(readOnly = true)
    public PromptResponse getPromptById(Long id) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prompt not found: " + id));
        return PromptResponse.from(prompt);
    }

    public PageResponse<UserResponse> getUsers(Pageable pageable) {
        return PageResponse.from(userRepository.findAll(pageable).map(UserResponse::from));
    }

    @Transactional
    public UserResponse toggleUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setEnabled(!user.isEnabled());
        return UserResponse.from(userRepository.save(user));
    }

    public PageResponse<PolicyKeyword> getKeywords(Pageable pageable) {
        return PageResponse.from(keywordRepository.findAll(pageable));
    }

    @Transactional
    public PolicyKeyword createKeyword(KeywordRequest req) {
        if (keywordRepository.existsByKeywordIgnoreCase(req.keyword())) {
            throw new ConflictException("Keyword already exists");
        }
        return keywordRepository.save(PolicyKeyword.builder().keyword(req.keyword().toLowerCase()).build());
    }

    @Transactional
    public PolicyKeyword updateKeyword(Long id, KeywordRequest req) {
        PolicyKeyword keyword = keywordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Keyword not found: " + id));
        keyword.setKeyword(req.keyword().toLowerCase());
        return keywordRepository.save(keyword);
    }

    @Transactional
    public void deleteKeyword(Long id) {
        if (!keywordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Keyword not found: " + id);
        }
        keywordRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public PageResponse<FlaggedPromptResponse> getFlaggedPrompts(Pageable pageable) {
        return PageResponse.from(
                flaggedPromptRepository.findAllByOrderByFlaggedAtDesc(pageable)
                        .map(FlaggedPromptResponse::from)
        );
    }
}
