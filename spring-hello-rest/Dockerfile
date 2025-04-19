FROM eclipse-temurin:21-jre
WORKDIR /app
COPY build/libs/hello-rest-0.0.1-SNAPSHOT.jar /app
USER nobody
ENTRYPOINT ["java", "-jar", "hello-rest-0.0.1-SNAPSHOT.jar"]
