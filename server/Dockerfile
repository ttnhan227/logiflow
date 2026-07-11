FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S logiflow && adduser -S logiflow -G logiflow
COPY --from=build /workspace/target/server-*.jar app.jar

USER logiflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
