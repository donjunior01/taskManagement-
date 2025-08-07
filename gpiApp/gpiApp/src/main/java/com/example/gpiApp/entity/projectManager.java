package com.example.gpiApp.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("MANAGER")
public class projectManager extends allUsers {
    public projectManager() {
        super();
        this.setUserRole(UserRole.MANAGER);
    }
}