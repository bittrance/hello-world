FROM golang:1.24 AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY main.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o ./gin-hello-rest

FROM gcr.io/distroless/static-debian12

COPY --from=build /app/gin-hello-rest /gin-hello-rest

EXPOSE 8080

CMD ["/gin-hello-rest"]
