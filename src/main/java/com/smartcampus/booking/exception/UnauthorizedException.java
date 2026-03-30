package com.smartcampus.booking.exception;

/**
 * Exception thrown when a user attempts to perform an action they don't have permission for
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
