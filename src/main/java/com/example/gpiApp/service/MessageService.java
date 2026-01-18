package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Message;
import com.example.gpiApp.repository.MessageRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    
    @Transactional(readOnly = true)
    public PagedResponse<MessageDTO> getAllMessages(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Message> messagePage = messageRepository.findAll(pageable);
        
        List<MessageDTO> messageDTOs = messagePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(messageDTOs, messagePage.getNumber(), messagePage.getSize(),
                messagePage.getTotalElements(), messagePage.getTotalPages(),
                messagePage.isFirst(), messagePage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<MessageDTO> getMessageById(Long id) {
        return messageRepository.findById(id)
                .map(message -> ApiResponse.success("Message retrieved successfully", convertToDTO(message)))
                .orElse(ApiResponse.error("Message not found"));
    }
    
    @Transactional
    public ApiResponse<MessageDTO> sendMessage(MessageRequestDTO request, Long senderId) {
        Message message = new Message();
        message.setContent(request.getContent());
        message.setSubject(request.getSubject());
        message.setIsRead(false);
        
        userRepository.findById(senderId)
                .ifPresent(message::setSender);
        
        // Handle project messages
        if (request.getProjectId() != null) {
            projectRepository.findById(request.getProjectId())
                    .ifPresent(message::setProject);
        }
        
        // Handle direct messages
        if (request.getRecipientId() != null) {
            userRepository.findById(request.getRecipientId())
                    .ifPresent(message::setRecipient);
        }
        
        Message savedMessage = messageRepository.save(message);
        
        // Log activity
        userRepository.findById(senderId).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.MESSAGE_SENT,
                request.getProjectId() != null ? 
                    "Message sent to project team" : "Message sent to user",
                user,
                "MESSAGE",
                savedMessage.getId(),
                null
            )
        );
        
        // Send notification to recipient
        if (request.getRecipientId() != null && message.getSender() != null) {
            String senderName = message.getSender().getFirstName() + " " + message.getSender().getLastName();
            notificationService.notifyNewMessage(request.getRecipientId(), senderId, senderName, savedMessage.getId());
        }
        
        return ApiResponse.success("Message sent successfully", convertToDTO(savedMessage));
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<List<MessageDTO>> getProjectMessages(Long projectId) {
        List<Message> messages = messageRepository.findByProjectId(projectId);
        List<MessageDTO> messageDTOs = messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ApiResponse.success("Project messages retrieved successfully", messageDTOs);
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<List<MessageDTO>> getDirectConversation(Long currentUserId, Long otherUserId) {
        List<Message> messages = messageRepository.findDirectConversation(currentUserId, otherUserId);
        List<MessageDTO> messageDTOs = messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ApiResponse.success("Conversation retrieved successfully", messageDTOs);
    }
    
    @Transactional
    public ApiResponse<Void> deleteMessage(Long id) {
        return messageRepository.findById(id)
                .map(message -> {
                    messageRepository.delete(message);
                    return ApiResponse.<Void>success("Message deleted successfully", null);
                })
                .orElse(ApiResponse.error("Message not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<MessageDTO> getSentMessages(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Message> messagePage = messageRepository.findBySenderId(userId, pageable);
        
        List<MessageDTO> messageDTOs = messagePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(messageDTOs, messagePage.getNumber(), messagePage.getSize(),
                messagePage.getTotalElements(), messagePage.getTotalPages(),
                messagePage.isFirst(), messagePage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<MessageDTO> getReceivedMessages(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Message> messagePage = messageRepository.findByRecipientId(userId, pageable);
        
        List<MessageDTO> messageDTOs = messagePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(messageDTOs, messagePage.getNumber(), messagePage.getSize(),
                messagePage.getTotalElements(), messagePage.getTotalPages(),
                messagePage.isFirst(), messagePage.isLast());
    }
    
    @Transactional(readOnly = true)
    public List<MessageDTO> getUnreadMessages(Long userId) {
        List<Message> unreadMessages = messageRepository.findUnreadByRecipientId(userId);
        return unreadMessages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<Long> getUnreadCount(Long userId) {
        Long count = messageRepository.countUnreadByRecipientId(userId);
        return ApiResponse.success("Unread count retrieved", count != null ? count : 0L);
    }
    
    @Transactional(readOnly = true)
    public List<MessageDTO> getConversation(Long userId1, Long userId2) {
        List<Message> messages = messageRepository.findConversation(userId1, userId2);
        return messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ApiResponse<Void> markAsRead(Long recipientId, Long senderId) {
        messageRepository.markAsRead(recipientId, senderId);
        return ApiResponse.success("Messages marked as read", null);
    }
    
    @Transactional
    public ApiResponse<Void> markSingleAsRead(Long messageId) {
        return messageRepository.findById(messageId)
                .map(message -> {
                    message.setIsRead(true);
                    messageRepository.save(message);
                    return ApiResponse.<Void>success("Message marked as read", null);
                })
                .orElse(ApiResponse.error("Message not found"));
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<List<MessageDTO>> getConversations(Long userId) {
        // Get all messages where user is sender or recipient
        List<Message> sentMessages = messageRepository.findBySenderIdOrderByCreatedAtDesc(userId);
        List<Message> receivedMessages = messageRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        
        // Combine and get unique conversations (latest message from each)
        java.util.Map<String, Message> latestMessages = new java.util.LinkedHashMap<>();
        
        java.util.List<Message> allMessages = new java.util.ArrayList<>();
        allMessages.addAll(sentMessages);
        allMessages.addAll(receivedMessages);
        allMessages.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        
        for (Message msg : allMessages) {
            String conversationKey;
            if (msg.getProject() != null) {
                conversationKey = "project_" + msg.getProject().getId();
            } else {
                Long otherUserId = msg.getSender().getId().equals(userId) ? 
                        (msg.getRecipient() != null ? msg.getRecipient().getId() : null) : 
                        msg.getSender().getId();
                if (otherUserId == null) continue;
                conversationKey = "user_" + Math.min(userId, otherUserId) + "_" + Math.max(userId, otherUserId);
            }
            latestMessages.putIfAbsent(conversationKey, msg);
        }
        
        List<MessageDTO> messageDTOs = latestMessages.values().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ApiResponse.success("Conversations retrieved successfully", messageDTOs);
    }
    
    private MessageDTO convertToDTO(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? 
                        message.getSender().getFirstName() + " " + message.getSender().getLastName() : null)
                .recipientId(message.getRecipient() != null ? message.getRecipient().getId() : null)
                .recipientName(message.getRecipient() != null ? 
                        message.getRecipient().getFirstName() + " " + message.getRecipient().getLastName() : null)
                .projectId(message.getProject() != null ? message.getProject().getId() : null)
                .projectName(message.getProject() != null ? message.getProject().getName() : null)
                .content(message.getContent())
                .subject(message.getSubject())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

