package com.expenselite.engine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private Long id; // <--- Certifique-se de que este campo existe
    private String token;
    private String email;
    private String role;
}