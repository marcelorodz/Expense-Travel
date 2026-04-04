package com.expenselite.engine.controller;

import com.expenselite.engine.dto.ExpenseRequest;
import com.expenselite.engine.dto.ExpenseResponse;
import com.expenselite.engine.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        log.info("POST /api/expenses - start");
        ExpenseResponse response = expenseService.create(request);
        log.info("POST /api/expenses - end | id: {}", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> findById(@PathVariable Long id) {
        log.info("GET /api/expenses/{} - start", id);
        ExpenseResponse response = expenseService.findById(id);
        log.info("GET /api/expenses/{} - end", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> findAll() {
        log.info("GET /api/expenses - start");
        List<ExpenseResponse> response = expenseService.findAll();
        log.info("GET /api/expenses - end | total: {}", response.size());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/approve/{id}")
    public ResponseEntity<ExpenseResponse> approve(@PathVariable Long id) {
        log.info("PATCH /api/expenses/approve/{} - start", id);
        ExpenseResponse response = expenseService.approve(id);
        log.info("PATCH /api/expenses/approve/{} - end", id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reject/{id}")
    public ResponseEntity<ExpenseResponse> reject(@PathVariable Long id) {
        log.info("PATCH /api/expenses/reject/{} - start", id);
        ExpenseResponse response = expenseService.reject(id);
        log.info("PATCH /api/expenses/reject/{} - end", id);
        return ResponseEntity.ok(response);
    }
}
