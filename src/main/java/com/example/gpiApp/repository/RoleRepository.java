package com.example.gpiApp.repository;

import com.example.gpiApp.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByOrganizationIdOrderByNameAsc(Long organizationId);
}
