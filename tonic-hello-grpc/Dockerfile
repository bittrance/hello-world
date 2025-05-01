FROM rust:1.85 AS builder
WORKDIR /usr/src/app
RUN apt-get update && \
    apt-get install --yes protobuf-compiler-grpc
COPY . .
RUN cargo install --path .

FROM debian:bookworm-slim
COPY --from=builder /usr/local/cargo/bin/hello-grpc /usr/local/bin/hello-grpc
USER nobody
ENTRYPOINT ["hello-grpc"]
