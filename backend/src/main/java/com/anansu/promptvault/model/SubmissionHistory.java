package com.anansu.promptvault.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submission_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmissionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    private Prompt prompt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String aiResponse;

    private LocalDateTime submittedAt;

    @PrePersist
    void prePersist() {
        submittedAt = LocalDateTime.now();
    }
}
