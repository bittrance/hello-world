FROM rust:1.85 as builder
WORKDIR /usr/src/app
COPY . .
RUN cargo install --path .

FROM debian:bookworm-slim
COPY --from=builder /usr/local/cargo/bin/hello-rest /usr/local/bin/hello-rest
CMD ["hello-rest"]
