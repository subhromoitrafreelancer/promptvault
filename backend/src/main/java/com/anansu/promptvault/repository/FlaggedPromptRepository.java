package com.anansu.promptvault.repository;

import com.anansu.promptvault.model.FlaggedPrompt;
import com.anansu.promptvault.model.Prompt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlaggedPromptRepository extends JpaRepository<FlaggedPrompt, Long> {
    void deleteByPrompt(Prompt prompt);
    Page<FlaggedPrompt> findAllByOrderByFlaggedAtDesc(Pageable pageable);
}
