package com.anansu.promptvault.repository;

import com.anansu.promptvault.model.PolicyKeyword;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyKeywordRepository extends JpaRepository<PolicyKeyword, Long> {
    boolean existsByKeywordIgnoreCase(String keyword);
    Page<PolicyKeyword> findAll(Pageable pageable);
}
