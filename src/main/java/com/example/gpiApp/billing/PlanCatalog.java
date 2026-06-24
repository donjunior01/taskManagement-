package com.example.gpiApp.billing;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The subscription tiers and their per-organization limits. A limit of -1 means "unlimited".
 * Payment/Stripe integration is a later step; this catalog drives limits and the plan UI today.
 */
public final class PlanCatalog {

    public static final class Plan {
        public final String key;
        public final int maxUsers;
        public final int maxProjects;
        public Plan(String key, int maxUsers, int maxProjects) {
            this.key = key; this.maxUsers = maxUsers; this.maxProjects = maxProjects;
        }
    }

    private static final Map<String, Plan> PLANS = new LinkedHashMap<>();
    static {
        PLANS.put("FREE", new Plan("FREE", 5, 3));
        PLANS.put("PRO", new Plan("PRO", 50, -1));
        PLANS.put("ENTERPRISE", new Plan("ENTERPRISE", -1, -1));
    }

    private PlanCatalog() {}

    public static Plan get(String key) {
        return PLANS.getOrDefault(key == null ? "FREE" : key.toUpperCase(), PLANS.get("FREE"));
    }

    public static boolean isValid(String key) {
        return key != null && PLANS.containsKey(key.toUpperCase());
    }

    public static Map<String, Plan> all() {
        return PLANS;
    }

    public static boolean withinLimit(int current, int limit) {
        return limit < 0 || current < limit;
    }
}
