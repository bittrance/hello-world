FROM eclipse-temurin:21-jdk AS builder

ARG WEBSERVER=tomcat

WORKDIR /app

COPY . /app
RUN ./gradlew
RUN ./gradlew -Dwebserver=$WEBSERVER build

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/build/libs/hello-rest-0.0.1-SNAPSHOT.jar /app

USER nobody
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "hello-rest-0.0.1-SNAPSHOT.jar"]
