package com.example.gpiApp.service;

import com.example.gpiApp.dto.CollaborationDTO;

public interface CollaborationService {
    CollaborationDTO getCollaborationDataByUser(String username);
}
