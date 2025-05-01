use std::{env, path::PathBuf, time::Duration};
use tokio::{signal, time::sleep};
use tonic::{
    Request, Response, Status,
    transport::{Identity, Server, ServerTlsConfig},
};
use tonic_health::server::health_reporter;

use greetings::greet_me_server::{GreetMe, GreetMeServer};
use greetings::{GreetRequest, GreetResponse};

pub mod greetings {
    tonic::include_proto!("greetings");
}

#[derive(Default)]
pub struct MyGreeter {
    request_delay: Duration,
}

#[tonic::async_trait]
impl GreetMe for MyGreeter {
    async fn send(
        &self,
        request: Request<GreetRequest>,
    ) -> Result<Response<GreetResponse>, Status> {
        sleep(self.request_delay).await;
        let reply = GreetResponse {
            greeting: format!("Hello {}!", request.into_inner().name),
        };
        Ok(Response::new(reply))
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let request_delay = Duration::try_from_secs_f32(
        env::var("HELLO_GRPC_REQUEST_DELAY")
            .unwrap_or("1.0".to_owned())
            .parse()
            .unwrap(),
    )
    .unwrap();
    let addr = "0.0.0.0:8080".parse().unwrap();
    let mut identity = None;
    if let Some(data_dir) = env::var("HELLO_GRPC_CERT_DIR").ok().map(PathBuf::from) {
        let cert = std::fs::read_to_string(data_dir.join("tls.crt"))?;
        let key = std::fs::read_to_string(data_dir.join("tls.key"))?;
        eprintln!("Using certs from {:?}", data_dir);
        identity = Some(Identity::from_pem(cert, key))
    }
    let (mut health_reporter, health_service) = health_reporter();
    health_reporter
        .set_serving::<GreetMeServer<MyGreeter>>()
        .await;
    let greeter_service = GreetMeServer::new(MyGreeter { request_delay });

    eprintln!("GreeterServer listening on {}", addr);

    let mut builder = Server::builder();
    if let Some(identity) = identity {
        builder = builder.tls_config(ServerTlsConfig::new().identity(identity))?;
    }
    builder
        .add_service(health_service)
        .add_service(greeter_service)
        .serve_with_shutdown(addr, shutdown_signal())
        .await?;

    Ok(())
}
