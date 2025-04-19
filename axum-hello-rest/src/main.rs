use std::{env, time::Duration};

use axum::{Router, routing::get};
use tokio::signal;

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
async fn main() {
    let request_delay = Duration::try_from_secs_f32(
        env::var("HELLO_REST_REQUEST_DELAY")
            .unwrap_or("1.0".to_owned())
            .parse()
            .unwrap(),
    )
    .unwrap();
    let startup_delay = Duration::try_from_secs_f32(
        env::var("HELLO_REST_STARTUP_DELAY")
            .unwrap_or("0.0".to_owned())
            .parse()
            .unwrap(),
    )
    .unwrap();
    let app = Router::new()
        .route(
            "/",
            get(async move || {
                tokio::time::sleep(request_delay).await;
                "Hello, World!"
            }),
        )
        .route("/health", get(async || "ok"));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    tokio::time::sleep(startup_delay).await;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}
