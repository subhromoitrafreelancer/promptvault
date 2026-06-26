package com.promptvault.service;

import com.promptvault.dto.request.LoginRequest;
import com.promptvault.dto.request.RegisterRequest;
import com.promptvault.dto.response.AuthResponse;
import com.promptvault.exception.ConflictException;
import com.promptvault.exception.ForbiddenException;
import com.promptvault.model.User;
import com.promptvault.repository.UserRepository;
import com.promptvault.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ConflictException("Username already taken");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already registered");
        }

        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .role("USER")
                .enabled(true)
                .build();
        userRepository.save(user);

        return new AuthResponse(jwtUtil.generateToken(user.getUsername(), user.getRole()), user.getRole());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ForbiddenException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new ForbiddenException("Account is disabled");
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ForbiddenException("Invalid credentials");
        }

        return new AuthResponse(jwtUtil.generateToken(user.getUsername(), user.getRole()), user.getRole());
    }
}
