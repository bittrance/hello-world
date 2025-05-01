# Hello world grpc demo in Rust

## Develop

Need the grpc compiler to process the `greetings.proto` contract.

```shell
sudo apt-get install protobuf-compiler-grpc
```

Since grpc is dependent on ALPN in production setups, let's start it with a TLS listener.

```shell
openssl req -nodes -x509 -sha256 -newkey rsa:4096 \
              -keyout server.key \
              -out server.pem \
              -days 1000 \
              -subj "/DC=net/DC=windwards/CN=tonic-hello-grpc.localtest.me" \
             -addext "subjectAltName = DNS:tonic-hello-grpc.localtest.me"
env HELLO_GRPC_CERT_DIR=. cargo run --release
```

## Smoke test

Test the service. We can also do `-plaintext` to test a non-TLS service.

```shell
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
grpcurl -insecure \
    -proto gateway-api-grpc/greetings.proto \
    -d '{"name": "Bittrance"}' \
    tonic-hello-grpc.localtest.me:8080 \
    greetings.GreetMe/Send
```

## Release

```shell
docker build -t bittrance/hello-world:tonic-grpc-1 .
```
