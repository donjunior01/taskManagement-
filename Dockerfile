# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Cache dependencies first (changes to pom invalidate only this layer).
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/performance-management-*.jar app.jar
EXPOSE 8073
ENTRYPOINT ["java", "-jar", "app.jar"]
