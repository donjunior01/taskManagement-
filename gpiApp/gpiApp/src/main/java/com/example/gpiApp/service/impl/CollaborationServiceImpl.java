package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.CollaborationDTO;
import com.example.gpiApp.service.CollaborationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CollaborationServiceImpl implements CollaborationService {

    @Override
    public CollaborationDTO getCollaborationDataByUser(String username) {
        CollaborationDTO collaborationData = new CollaborationDTO();
        
        // Team members
        List<CollaborationDTO.TeamMemberDTO> teamMembers = new ArrayList<>();
        
        CollaborationDTO.TeamMemberDTO member1 = new CollaborationDTO.TeamMemberDTO();
        member1.setId(1L);
        member1.setName("John Doe");
        member1.setRole("Developer");
        member1.setStatus("online");
        member1.setAvatar("/images/john-avatar.png");
        teamMembers.add(member1);
        
        CollaborationDTO.TeamMemberDTO member2 = new CollaborationDTO.TeamMemberDTO();
        member2.setId(2L);
        member2.setName("Jane Smith");
        member2.setRole("Manager");
        member2.setStatus("away");
        member2.setAvatar("/images/jane-avatar.png");
        teamMembers.add(member2);
        
        collaborationData.setTeamMembers(teamMembers);
        
        // Messages
        List<CollaborationDTO.MessageDTO> messages = new ArrayList<>();
        
        CollaborationDTO.MessageDTO message1 = new CollaborationDTO.MessageDTO();
        message1.setId(1L);
        message1.setAuthor("John Doe");
        message1.setContent("Has anyone reviewed the latest design mockups?");
        message1.setTimestamp(LocalDateTime.now().minusHours(2).toString());
        messages.add(message1);
        
        CollaborationDTO.MessageDTO message2 = new CollaborationDTO.MessageDTO();
        message2.setId(2L);
        message2.setAuthor("Jane Smith");
        message2.setContent("I'll review them by end of day");
        message2.setTimestamp(LocalDateTime.now().minusHours(1).toString());
        messages.add(message2);
        
        collaborationData.setMessages(messages);
        
        return collaborationData;
    }
}
