package com.example.gpiApp.config.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/** Unit tests for the per-IP auth rate limiter (its own instance/map — no shared state). */
class AuthRateLimitFilterTest {

    private void call(AuthRateLimitFilter f, String uri, String ip, MockHttpServletResponse res, FilterChain chain) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
        req.setRemoteAddr(ip);
        f.doFilter(req, res, chain);
    }

    @Test
    void allowsUpToTheLimitThenBlocksWith429() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(3, 60_000);
        for (int i = 1; i <= 3; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);
            call(filter, "/api/auth/login", "10.0.0.1", res, chain);
            verify(chain).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
            assertThat(res.getStatus()).isNotEqualTo(429);
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        call(filter, "/api/auth/login", "10.0.0.1", blocked, chain);
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isEqualTo("60");
        verifyNoInteractions(chain);
    }

    @Test
    void differentIpsHaveSeparateBudgets() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(1, 60_000);
        MockHttpServletResponse a = new MockHttpServletResponse();
        call(filter, "/api/auth/login", "1.1.1.1", a, mock(FilterChain.class));       // uses A's budget
        MockHttpServletResponse b = new MockHttpServletResponse();
        FilterChain bChain = mock(FilterChain.class);
        call(filter, "/api/auth/login", "2.2.2.2", b, bChain);                          // B still has budget
        assertThat(b.getStatus()).isNotEqualTo(429);
        verify(bChain).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void nonAuthPathsAreNeverRateLimited() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(1, 60_000);
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);
            call(filter, "/api/tasks", "9.9.9.9", res, chain);
            assertThat(res.getStatus()).isNotEqualTo(429);
        }
    }
}
