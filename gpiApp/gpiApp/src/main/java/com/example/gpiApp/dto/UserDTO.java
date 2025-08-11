package com.example.gpiApp.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Builder
@Data
public class UserDTO {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String role;
    private String status;
    private String avatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String department;
    private String position;

}