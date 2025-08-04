package com.example.gpiApp.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "admins")
@DiscriminatorValue("ADMIN")
public class Admin extends allUsers {
    public Admin() {
        super();
        this.setUserRole(UserRole.SUPER_ADMIN);
    }
} 