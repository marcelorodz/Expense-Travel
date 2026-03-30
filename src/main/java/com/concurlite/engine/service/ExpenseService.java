package com.concurlite.engine.service;

import com.concurlite.engine.domain.*;
import com.concurlite.engine.dto.ExpenseRequest;
import com.concurlite.engine.dto.ExpenseResponse;
import com.concurlite.engine.repository.ExpenseRepository;
import com.concurlite.engine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    private static final BigDecimal AUDIT_THRESHOLD = new BigDecimal("4000.00");

    public ExpenseResponse create(ExpenseRequest request) {
        log.info("Creating expense for user ID: {}", request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        Expense expense = new Expense();
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setUser(user);

        // Regra de negócio: Obrigatório auditar se valor > 4000
        expense.setAuditFlag(request.getAmount().compareTo(AUDIT_THRESHOLD) > 0);

        Expense saved = expenseRepository.save(expense);
        log.info("Expense created with ID: {} | auditFlag: {}", saved.getId(), saved.isAuditFlag());

        return toResponse(saved);
    }

    public ExpenseResponse findById(Long id) {
        log.info("Fetching expense ID: {}", id);
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));
        return toResponse(expense);
    }

    public List<ExpenseResponse> findAll() {
        log.info("Fetching all expenses");
        return expenseRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ExpenseResponse approve(Long id) {
        log.info("Approving expense ID: {}", id);
        return updateStatus(id, ExpenseStatus.APPROVED);
    }

    public ExpenseResponse reject(Long id) {
        log.info("Rejecting expense ID: {}", id);
        return updateStatus(id, ExpenseStatus.REJECTED);
    }

    private ExpenseResponse updateStatus(Long id, ExpenseStatus status) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));
        expense.setStatus(status);
        Expense saved = expenseRepository.save(expense);
        return toResponse(saved);
    }

    private ExpenseResponse toResponse(Expense expense) {
        ExpenseResponse response = new ExpenseResponse();
        response.setId(expense.getId());
        response.setDescription(expense.getDescription());
        response.setAmount(expense.getAmount());
        response.setCategory(expense.getCategory());
        response.setStatus(expense.getStatus());
        response.setAuditFlag(expense.isAuditFlag());
        response.setCreatedAt(expense.getCreatedAt());
        response.setUserName(expense.getUser().getName());
        return response;
    }
}