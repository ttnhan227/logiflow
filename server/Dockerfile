# syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -DincludeScope=runtime dependency:resolve

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -Dmaven.test.skip=true package && \
    cp target/server-*.jar /workspace/app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S logiflow && adduser -S logiflow -G logiflow
COPY --from=build --chown=logiflow:logiflow /workspace/app.jar /app/app.jar

USER logiflow
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=45s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/app.jar"]
