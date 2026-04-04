package com.expenselite.engine.repository;


import com.expenselite.engine.domain.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest // Foca apenas nos componentes de JPA/Banco de dados
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ExpenseRepositoryTest {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    private User savedUser;

    @BeforeEach
    void setUp() {

        expenseRepository.deleteAll();
        userRepository.deleteAll();
        // Precisamos salvar um usuário antes, pois Expense tem uma relação @ManyToOne com User
        User user = new User();
        user.setName("John Test");
        user.setEmail("test@test.com");
        user.setPassword("password123");
        user.setRole(Role.EMPLOYEE);
        savedUser = userRepository.save(user);
    }

    @Test
    void shouldSaveAndFindExpense() {
        // Arrange
        Expense expense = new Expense();
        expense.setDescription("Business Travel");
        expense.setAmount(new BigDecimal("1500.00"));
        expense.setCategory(Category.TRAVEL);
        expense.setStatus(ExpenseStatus.PENDING);
        expense.setAuditFlag(false);
        expense.setCreatedAt(LocalDateTime.now());
        expense.setUser(savedUser);

        // Act
        Expense savedExpense = expenseRepository.save(expense);

        // Assert
        assertThat(savedExpense.getId()).isNotNull();
        assertThat(savedExpense.getDescription()).isEqualTo("Business Travel");
    }

    @Test
    void shouldFindByStatusAndAmount() {
        // Arrange
        Expense expense = new Expense();
        expense.setDescription("Expensive Dinner");
        expense.setAmount(new BigDecimal("6000.00"));
        expense.setCategory(Category.FOOD);
        expense.setStatus(ExpenseStatus.PENDING);
        expense.setAuditFlag(true);
        expense.setCreatedAt(LocalDateTime.now());
        expense.setUser(savedUser);
        expenseRepository.save(expense);

        // Act
        List<Expense> expenses = expenseRepository.findByStatusAndMinAmount(
                ExpenseStatus.PENDING, new BigDecimal("5000.00"));

        // Assert
        assertThat(expenses).hasSize(1);
        assertThat(expenses.get(0).getDescription()).isEqualTo("Expensive Dinner");
    }
}
