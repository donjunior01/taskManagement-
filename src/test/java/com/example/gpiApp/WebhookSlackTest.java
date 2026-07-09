package com.example.gpiApp;

import com.example.gpiApp.service.WebhookDispatcher;
import com.example.gpiApp.service.WebhookService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Pure formatting for the Slack integration: the human summary and the Slack {text} body. */
class WebhookSlackTest {

    @Test
    void slackTextIncludesEventAndName() {
        String text = WebhookService.buildSlackText("task.created", Map.of("name", "Ship v2"));
        assertTrue(text.contains("task.created"));
        assertTrue(text.contains("Ship v2"));
    }

    @Test
    void slackTextOmitsDashWhenNoName() {
        String text = WebhookService.buildSlackText("project.updated", Map.of());
        assertTrue(text.contains("project.updated"));
        assertFalse(text.contains("—"));
    }

    @Test
    void slackBodyIsValidJsonWithEscapedText() {
        // A name with a quote must not break the JSON body.
        String body = WebhookDispatcher.slackBody("alert \"prod\" down");
        assertTrue(body.startsWith("{\"text\":"));
        assertTrue(body.contains("\\\"prod\\\""));   // the inner quotes are escaped
    }
}
