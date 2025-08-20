package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.CollaborationDTO;
import com.example.gpiApp.dto.MessageDTO;
import com.example.gpiApp.entity.Comment;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.CommentRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.CollaborationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CollaborationServiceImpl implements CollaborationService {

    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public CollaborationServiceImpl(UserRepository userRepository,
                                   CommentRepository commentRepository) {
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CollaborationDTO getCollaborationDataByUser(String username) {
        CollaborationDTO collaborationData = new CollaborationDTO();
        
        // Get team members (all active users)
        List<CollaborationDTO.TeamMemberDTO> teamMembers = userRepository.findActiveUsers().stream()
                .map(this::toTeamMemberDTO)
                .collect(Collectors.toList());
        
        collaborationData.setTeamMembers(teamMembers);
        
        // Get messages from comments -> map to global MessageDTO
        List<MessageDTO> messages = commentRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(10)
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
        collaborationData.setMessages(messages);
        
        return collaborationData;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesByUser(String username) {
        return commentRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
    }

    private CollaborationDTO.TeamMemberDTO toTeamMemberDTO(allUsers user) {
        CollaborationDTO.TeamMemberDTO dto = new CollaborationDTO.TeamMemberDTO();
        dto.setId(user.getUserId());
        dto.setName(user.getFirstName() + " " + user.getLastName());
        dto.setRole(user.getUserPost() != null ? String.valueOf(user.getUserPost()) : "Employee");
        dto.setStatus(Boolean.TRUE.equals(user.getIsActive()) ? "online" : "offline");
        dto.setAvatar("/images/default-avatar.png");
        return dto;
    }

    private MessageDTO toMessageDTO(Comment comment) {
        return MessageDTO.builder()
                .id(comment.getCommentId())
                .title("Task Comment")
                .preview(comment.getTask() != null ? comment.getTask().getTitle() : "")
                .content(comment.getCommentText())
                .time(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : "")
                .unread(Boolean.TRUE)
                .build();
    }
}
