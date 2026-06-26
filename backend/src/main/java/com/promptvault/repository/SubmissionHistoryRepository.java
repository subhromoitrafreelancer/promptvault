package com.promptvault.repository;

import com.promptvault.model.SubmissionHistory;
import com.promptvault.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionHistoryRepository extends JpaRepository<SubmissionHistory, Long> {
    Page<SubmissionHistory> findByUserOrderBySubmittedAtDesc(User user, Pageable pageable);
}
