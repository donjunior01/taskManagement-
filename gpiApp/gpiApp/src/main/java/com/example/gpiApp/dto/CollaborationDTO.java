package com.example.gpiApp.dto;

import lombok.Data;
import java.util.List;

@Data
public class CollaborationDTO {
    private List<TeamMemberDTO> teamMembers;
    private List<MessageDTO> messages; // Use global MessageDTO

    @Data
    public static class TeamMemberDTO {
        private Long id;
        private String name;
        private String role;
        private String status;
        private String avatar;
    }
}
 