package com.concurlite.engine.service;

import com.concurlite.engine.domain.*;
import com.concurlite.engine.dto.ExpenseRequest;
import com.concurlite.engine.dto.ExpenseResponse;
import com.concurlite.engine.repository.ExpenseRepository;
import com.concurlite.engine.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpenseService expenseService;

    @ParameterizedTest
    @CsvSource({
            "6000.00, true",  // Above 5000 -> Audit flag should be true
            "5000.00, false", // Exactly 5000 -> Audit flag should be false
            "100.00, false",  // Below 5000 -> Audit flag should be false
            "0.01, false"     // Minimum value -> Audit flag should be false
    })
    void shouldCalculateAuditFlagCorrectly(String amount, boolean expectedAuditFlag) {
        // Arrange
        ExpenseRequest request = new ExpenseRequest();
        request.setDescription("Business Trip");
        request.setAmount(new BigDecimal(amount));
        request.setCategory(Category.TRAVEL);
        request.setUserId(1L);

        User user = new User();
        user.setName("John Doe");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        // Mock save returning the same object
        when(expenseRepository.save(any(Expense.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        ExpenseResponse response = expenseService.create(request);

        // Assert
        assertEquals(expectedAuditFlag, response.isAuditFlag(),
                "Audit flag calculation failed for amount: " + amount);
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Arrange
        ExpenseRequest request = new ExpenseRequest();
        request.setUserId(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> expenseService.create(request),
                "Should throw ResourceNotFoundException when user is not found");
    }
}