package com.example.gpiApp.dto;

import lombok.Data;
import java.util.List;

@Data
public class CollaborationDTO {
    private List<TeamMemberDTO> teamMembers;
    private List<MessageDTO> messages;
    
    @Data
    public static class TeamMemberDTO {
        private Long id;
        private String name;
        private String role;
        private String status;
        private String avatar;
    }
    
    @Data
    public static class MessageDTO {
        private Long id;
        private String author;
        private String content;
        private String timestamp;
    }
}
