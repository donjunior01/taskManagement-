package com.example.gpiApp.service;

import com.example.gpiApp.dto.CollaborationDTO;
import com.example.gpiApp.dto.MessageDTO;

import java.util.List;

public interface CollaborationService {
    CollaborationDTO getCollaborationDataByUser(String username);
    List<MessageDTO> getMessagesByUser(String username);
}
