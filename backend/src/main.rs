use anyhow::Result;
use axum::{
    Router,
    routing::{get, post},
};
use std::{env, sync::Arc};
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use budget_tracker_backend::{
    ApiDoc, app_state::AppState, database, handlers::*, scheduler::*, sync::SyncService,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables first
    dotenv::dotenv().ok(); // Load .env file if it exists
    tracing_subscriber::fmt::init();

    // Load environment variables
    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:budget_tracker.db".to_string());
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "3001".to_string());

    // SimpleFin integration - optional, warn if not present
    let simplefin_access_url = match env::var("SIMPLEFIN_ACCESS_URL") {
        Ok(url) => {
            tracing::info!("SimpleFin integration enabled");
            url
        }
        Err(_) => {
            panic!("SIMPLEFIN_ACCESS_URL not set. Please set it in the environment variables.");
        }
    };

    // Create database connection pool
    let pool = database::create_pool(&database_url).await?;
    tracing::info!("Database connected successfully");

    // Initialize SimpleFin sync service
    let sync_service = match SyncService::new(pool.clone(), simplefin_access_url) {
        Ok(service) => {
            let service_arc = Arc::new(service);

            // Perform initial sync
            perform_initial_sync(&service_arc).await?;

            // Start background scheduler (5 minutes)
            let scheduler = SyncScheduler::new(service_arc.clone(), 5);
            scheduler.start_background_sync().await?;

            Some(service_arc)
        }
        Err(e) => {
            tracing::error!("Failed to initialize SimpleFin service: {}", e);
            tracing::warn!("Server will continue without SimpleFin integration");
            None
        }
    };

    // Create application state
    let app_state = AppState::new(pool, sync_service);

    // Create router
    let app = Router::new()
        .route("/api/accounts", get(get_accounts).post(create_account))
        .route("/api/accounts/:id", get(get_account))
        .route(
            "/api/accounts/:id/transactions",
            get(get_account_transactions),
        )
        .route("/api/transactions", post(create_transaction))
        .route("/api/sync", post(trigger_sync))
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("🚀 Server running on http://localhost:{}", port);
    tracing::info!("📚 API Documentation: http://localhost:{}/swagger-ui", port);

    axum::serve(listener, app).await?;

    Ok(())
}
