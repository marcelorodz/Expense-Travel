package com.concurlite.engine.controller;

import com.concurlite.engine.domain.User;
import com.concurlite.engine.dto.AuthRequest;
import com.concurlite.engine.dto.AuthResponse;
import com.concurlite.engine.repository.UserRepository;
import com.concurlite.engine.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("REST request to login user: {}", request.getEmail());
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody User user) {
        log.info("REST request to register new user: {}", user.getEmail());
        
        // Verificação de segurança: E-mail único
        if(userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Criptografia da senha antes de salvar (Obrigatório em sistemas financeiros)
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok("User registered successfully with role: " + user.getRole());
    }
}