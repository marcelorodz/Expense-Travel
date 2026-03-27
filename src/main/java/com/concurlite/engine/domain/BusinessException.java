package com.concurlite.engine.domain;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}