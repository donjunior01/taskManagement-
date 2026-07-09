package com.example.gpiApp;

import com.example.gpiApp.service.EmailTemplateService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplateServiceTest {

    private EmailTemplateService service() {
        EmailTemplateService s = new EmailTemplateService();
        ReflectionTestUtils.setField(s, "appName", "TaskMaster Pro");
        ReflectionTestUtils.setField(s, "brandColor", "#2563eb");
        return s;
    }

    @Test
    void rendersBrandedHtmlWithTitleAndBody() {
        String html = service().render("Task due soon", "Your task is due tomorrow.\nPlease review.");

        assertTrue(html.startsWith("<!DOCTYPE html>"));
        assertTrue(html.contains("TaskMaster Pro"));
        assertTrue(html.contains("#2563eb"));
        assertTrue(html.contains("Task due soon"));
        // Newlines become <br> in the body.
        assertTrue(html.contains("due tomorrow.<br>Please review."));
    }

    @Test
    void escapesHtmlToPreventInjection() {
        String html = service().render("Alert", "<script>alert('x')</script>");

        assertFalse(html.contains("<script>"));
        assertTrue(html.contains("&lt;script&gt;"));
    }

    @Test
    void omitsHeadingWhenTitleBlank() {
        String html = service().render("", "Body only.");
        assertFalse(html.contains("<h1"));
        assertTrue(html.contains("Body only."));
    }
}
