package com.example.gpiApp.config.security;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Primary
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        allUsers allUsers = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("allUsers not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                allUsers.getEmail(),
                allUsers.getPassword(),
                true, // enabled
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + allUsers.getRole().name()))
        );
    }
} 