package com.promptvault.config;

import com.promptvault.model.*;
import com.promptvault.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PromptRepository promptRepository;
    private final PolicyKeywordRepository keywordRepository;
    private final FlaggedPromptRepository flaggedPromptRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) return;

        User admin = userRepository.save(User.builder()
                .username("admin").email("admin@promptvault.com")
                .password(passwordEncoder.encode("admin123")).role("ADMIN").enabled(true).build());

        User alice = userRepository.save(User.builder()
                .username("alice").email("alice@example.com")
                .password(passwordEncoder.encode("password123")).role("USER").enabled(true).build());

        User bob = userRepository.save(User.builder()
                .username("bob").email("bob@example.com")
                .password(passwordEncoder.encode("password123")).role("USER").enabled(true).build());

        Category coding = categoryRepository.save(Category.builder()
                .name("Coding").description("Software development and programming prompts").build());
        Category creative = categoryRepository.save(Category.builder()
                .name("Creative Writing").description("Story, poetry, and creative prompts").build());
        Category research = categoryRepository.save(Category.builder()
                .name("Research").description("Research and analysis prompts").build());

        List.of("password", "api key", "secret", "private key", "confidential").forEach(kw ->
                keywordRepository.save(PolicyKeyword.builder().keyword(kw).build())
        );

        promptRepository.save(Prompt.builder()
                .title("Explain Spring Boot").body("What is Spring Boot and how does dependency injection work?")
                .category(coding).user(alice).visibility("PUBLIC").flagged(false).build());

        promptRepository.save(Prompt.builder()
                .title("Write a short story").body("Write a 200-word short story about a robot learning to paint.")
                .category(creative).user(alice).visibility("PUBLIC").flagged(false).build());

        promptRepository.save(Prompt.builder()
                .title("Research summary").body("Summarise the latest trends in large language model research.")
                .category(research).user(bob).visibility("PUBLIC").flagged(false).build());

        Prompt flaggedPrompt = promptRepository.save(Prompt.builder()
                .title("Private note").body("My private API key reminder — keep this confidential.")
                .category(coding).user(bob).visibility("PRIVATE").flagged(true).build());

        // Seed audit rows for the flagged prompt
        flaggedPromptRepository.save(FlaggedPrompt.builder().prompt(flaggedPrompt).keyword("api key").build());
        flaggedPromptRepository.save(FlaggedPrompt.builder().prompt(flaggedPrompt).keyword("confidential").build());

        promptRepository.save(Prompt.builder()
                .title("Docker tutorial").body("Explain Docker containers and how to write a Dockerfile.")
                .category(coding).user(alice).visibility("PUBLIC").flagged(false).build());
    }
}
