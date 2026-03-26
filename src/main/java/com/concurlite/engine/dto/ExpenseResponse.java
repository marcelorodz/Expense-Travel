package com.concurlite.engine.dto;

import com.concurlite.engine.domain.Category;
import com.concurlite.engine.domain.ExpenseStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ExpenseResponse {
    private Long id;
    private String description;
    private BigDecimal amount;
    private Category category;
    private ExpenseStatus status;
    private boolean auditFlag;
    private LocalDateTime createdAt;
    private String userName;
}