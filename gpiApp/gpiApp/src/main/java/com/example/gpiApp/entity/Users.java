package com.example.gpiApp.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
@DiscriminatorValue("EMPLOYEE")
public class Users extends allUsers {
    public Users() {
        super();
        this.setUserRole(UserRole.EMPLOYEE);
    }
} 