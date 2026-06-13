package com.example.gpiApp.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves the "real" client IP (substituting the machine's actual public/LAN IP when a request
 * arrives over loopback, e.g. local dev) and looks up a country for an IP via a free GeoIP service.
 * Everything is cached so the security pages stay fast.
 */
@Slf4j
@Service
public class IpResolverService {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    private volatile String machineIp;                     // cached real machine IP (public, else LAN)
    private final ConcurrentHashMap<String, String> countryCache = new ConcurrentHashMap<>();
    private static final Pattern COUNTRY = Pattern.compile("\"country\"\\s*:\\s*\"([^\"]*)\"");

    /** Resolve the machine IP in the background at startup so the first request isn't delayed. */
    @jakarta.annotation.PostConstruct
    void warmUp() {
        Thread t = new Thread(this::getMachineIp, "ip-resolver-warmup");
        t.setDaemon(true);
        t.start();
    }

    /** Best client IP for a request: X-Forwarded-For, else remote addr; loopback → the real machine IP. */
    public String resolveClientIp(HttpServletRequest request) {
        String ip = null;
        if (request != null) {
            String fwd = request.getHeader("X-Forwarded-For");
            if (fwd != null && !fwd.isBlank()) ip = fwd.split(",")[0].trim();
            else ip = request.getRemoteAddr();
        }
        if (ip == null || ip.isBlank() || isLoopback(ip)) {
            return getMachineIp();
        }
        return ip;
    }

    /** Resolve the IP of the request currently being handled (for code paths without a request param). */
    public String resolveCurrentRequestIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return resolveClientIp(attrs != null ? attrs.getRequest() : null);
        } catch (Exception e) {
            return getMachineIp();
        }
    }

    /** The machine's real IP — public IP when reachable, otherwise the first non-loopback LAN address. */
    public String getMachineIp() {
        String cached = machineIp;
        if (cached != null) return cached;
        synchronized (this) {
            if (machineIp != null) return machineIp;
            String resolved = fetchPublicIp();
            if (resolved == null || resolved.isBlank()) resolved = lanIp();
            if (resolved == null || resolved.isBlank()) resolved = "127.0.0.1";
            machineIp = resolved;
            return machineIp;
        }
    }

    /** Country name for an IP via ip-api.com (cached). Private/loopback addresses → "Réseau local". */
    public String lookupCountry(String ip) {
        if (ip == null || ip.isBlank()) return "Inconnu";
        if (isPrivate(ip)) return "Réseau local";
        return countryCache.computeIfAbsent(ip, this::fetchCountry);
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private String fetchPublicIp() {
        for (String url : new String[]{"https://api.ipify.org", "http://checkip.amazonaws.com"}) {
            try {
                HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(2)).GET().build();
                HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
                String body = resp.body() != null ? resp.body().trim() : "";
                if (resp.statusCode() == 200 && !body.isBlank() && body.length() <= 45) return body;
            } catch (Exception e) {
                log.debug("Public IP lookup failed via {}: {}", url, e.getMessage());
            }
        }
        return null;
    }

    private String lanIp() {
        try {
            Enumeration<NetworkInterface> nics = NetworkInterface.getNetworkInterfaces();
            while (nics.hasMoreElements()) {
                NetworkInterface nic = nics.nextElement();
                if (!nic.isUp() || nic.isLoopback() || nic.isVirtual()) continue;
                Enumeration<InetAddress> addrs = nic.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress a = addrs.nextElement();
                    if (!a.isLoopbackAddress() && a.getAddress().length == 4) return a.getHostAddress();
                }
            }
        } catch (Exception e) {
            log.debug("LAN IP resolution failed: {}", e.getMessage());
        }
        return null;
    }

    private String fetchCountry(String ip) {
        try {
            HttpRequest req = HttpRequest.newBuilder(
                    URI.create("http://ip-api.com/json/" + ip + "?fields=status,country"))
                    .timeout(Duration.ofSeconds(2)).GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 && resp.body() != null) {
                Matcher m = COUNTRY.matcher(resp.body());
                if (m.find() && !m.group(1).isBlank()) return m.group(1);
            }
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for {}: {}", ip, e.getMessage());
        }
        return "Inconnu";
    }

    private boolean isLoopback(String ip) {
        String s = ip.toLowerCase();
        return s.equals("127.0.0.1") || s.startsWith("127.") || s.equals("::1")
                || s.equals("0:0:0:0:0:0:0:1") || s.equals("localhost");
    }

    private boolean isPrivate(String ip) {
        if (isLoopback(ip)) return true;
        String s = ip.toLowerCase();
        if (s.startsWith("10.") || s.startsWith("192.168.") || s.startsWith("169.254.")
                || s.startsWith("fe80") || s.startsWith("fc") || s.startsWith("fd")) return true;
        if (s.startsWith("172.")) {
            try {
                int second = Integer.parseInt(s.split("\\.")[1]);
                return second >= 16 && second <= 31;
            } catch (Exception ignore) { return false; }
        }
        return false;
    }
}
