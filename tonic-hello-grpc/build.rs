fn main() {
    tonic_build::configure()
        .compile_protos(&["greetings.proto"], &["proto"])
        .unwrap();
}
