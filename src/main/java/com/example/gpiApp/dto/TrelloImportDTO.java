package com.example.gpiApp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Subset of a Trello board JSON export (File ▸ Export ▸ JSON). Only the fields the importer needs are
 * declared; everything else Trello includes is ignored.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrelloImportDTO {

    private String name;
    private List<TrelloList> lists;
    private List<TrelloCard> cards;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrelloList {
        private String id;
        private String name;
        private boolean closed;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrelloCard {
        private String name;
        private String desc;
        private String idList;
        private boolean closed;
        private String due;   // ISO-8601, may be null
    }
}
