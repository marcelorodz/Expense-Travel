package com.concurlite.engine.repository;

import com.concurlite.engine.domain.Expense;
import com.concurlite.engine.domain.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByStatus(ExpenseStatus status);

    // Custom JPQL query - Senior challenge
    @Query("SELECT e FROM Expense e WHERE e.status = :status AND e.amount >= :amount")
    List<Expense> findByStatusAndMinAmount(
            @Param("status") ExpenseStatus status,
            @Param("amount") BigDecimal amount
    );
}