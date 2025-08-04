package com.example.gpiApp.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "project_Managers")
@DiscriminatorValue("PROJECT_MANAGER")
public class projectManager extends allUsers {
    public projectManager() {
        super();
        this.setUserRole(UserRole.MANAGER);
    }
}