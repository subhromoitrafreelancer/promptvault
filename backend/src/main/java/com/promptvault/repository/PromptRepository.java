package com.promptvault.repository;

import com.promptvault.model.Prompt;
import com.promptvault.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromptRepository extends JpaRepository<Prompt, Long> {
    Page<Prompt> findByUser(User user, Pageable pageable);
    Page<Prompt> findByVisibility(String visibility, Pageable pageable);
    boolean existsByCategoryId(Long categoryId);
    long countByFlaggedTrue();
}
