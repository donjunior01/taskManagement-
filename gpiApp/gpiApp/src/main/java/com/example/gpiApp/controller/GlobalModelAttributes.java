package com.example.gpiApp.controller;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Optional;

@ControllerAdvice
@RequiredArgsConstructor
public class GlobalModelAttributes {

    private final UserRepository userRepository;

    @ModelAttribute
    public void addAuthenticatedUserToModel(Model model, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }
        Optional<allUsers> currentUser = userRepository.findByEmail(authentication.getName());
        currentUser.ifPresent(user -> model.addAttribute("user", user));
    }
}


