package com.promptvault.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flagged_prompts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FlaggedPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    private Prompt prompt;

    @Column(nullable = false, length = 100)
    private String keyword;

    private LocalDateTime flaggedAt;

    @PrePersist
    void prePersist() {
        flaggedAt = LocalDateTime.now();
    }
}
