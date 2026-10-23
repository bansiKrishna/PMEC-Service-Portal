



# This configuration builds the application using Maven and Java 21 inside the container, then runs the packaged Spring Boot JAR. 
# It avoids your previously broken Windows Maven wrapper.

# Build the Spring Boot backend
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY . .
RUN mvn -DskipTests package

# Run the application
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]

