package com.expenselite.engine.repository;

import com.expenselite.engine.domain.Expense;
import com.expenselite.engine.domain.ExpenseStatus;
import com.expenselite.engine.domain.User; // <--- ADICIONE ESTA LINHA
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);

    @Query("SELECT e FROM Expense e WHERE e.status = :status AND e.amount >= :amount")
    List<Expense> findByStatusAndMinAmount(
        @Param("status") ExpenseStatus status,
        @Param("amount") BigDecimal amount
    );
}