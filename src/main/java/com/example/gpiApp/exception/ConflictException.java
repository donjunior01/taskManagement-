package com.example.gpiApp.exception;

/**
 * A concurrent-modification conflict: the resource was changed by someone else since the caller
 * loaded it. Mapped to HTTP 409 so the client can prompt the user to reload before overwriting.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
