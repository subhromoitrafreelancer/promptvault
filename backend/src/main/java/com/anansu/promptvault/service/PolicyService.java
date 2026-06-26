package com.anansu.promptvault.service;

import com.anansu.promptvault.model.FlaggedPrompt;
import com.anansu.promptvault.model.Prompt;
import com.anansu.promptvault.repository.FlaggedPromptRepository;
import com.anansu.promptvault.repository.PolicyKeywordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyKeywordRepository keywordRepository;
    private final FlaggedPromptRepository flaggedPromptRepository;

    public List<String> scan(String body) {
        String lower = body.toLowerCase();
        return keywordRepository.findAll().stream()
                .map(k -> k.getKeyword().toLowerCase())
                .filter(lower::contains)
                .toList();
    }

    @Transactional
    public List<String> applyFlags(Prompt prompt) {
        List<String> matched = scan(prompt.getBody());

        flaggedPromptRepository.deleteByPrompt(prompt);

        if (!matched.isEmpty()) {
            prompt.setFlagged(true);
            matched.forEach(keyword ->
                flaggedPromptRepository.save(
                    FlaggedPrompt.builder().prompt(prompt).keyword(keyword).build()
                )
            );
        } else {
            prompt.setFlagged(false);
        }

        return matched;
    }
}
