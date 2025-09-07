use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use chrono::Utc;

use crate::models::*;
use crate::sync::SyncStats;
use crate::app_state::AppState;

/// Get all accounts
#[utoipa::path(
    get,
    path = "/api/accounts",
    responses(
        (status = 200, description = "List of all accounts", body = Vec<Account>),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_accounts(
    State(app_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<Account>>>, StatusCode> {
    let accounts = sqlx::query_as::<_, Account>("SELECT * FROM accounts ORDER BY created_at DESC")
        .fetch_all(&app_state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(accounts)))
}

/// Create a new account
#[utoipa::path(
    post,
    path = "/api/accounts",
    request_body = CreateAccountRequest,
    responses(
        (status = 201, description = "Account created successfully", body = Account),
        (status = 400, description = "Invalid request data"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn create_account(
    State(app_state): State<AppState>,
    Json(payload): Json<CreateAccountRequest>,
) -> Result<Json<ApiResponse<Account>>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let account = sqlx::query_as::<_, Account>(
        r#"
        INSERT INTO accounts (id, name, institution, account_type, balance, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.institution)
    .bind(&payload.account_type)
    .bind(payload.balance)
    .bind(now)
    .bind(now)
    .fetch_one(&app_state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(account)))
}

/// Get account by ID
#[utoipa::path(
    get,
    path = "/api/accounts/{id}",
    params(
        ("id" = String, Path, description = "Account ID")
    ),
    responses(
        (status = 200, description = "Account found", body = Account),
        (status = 404, description = "Account not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_account(
    State(app_state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Account>>, StatusCode> {
    let account = sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE id = ?")
        .bind(&id)
        .fetch_optional(&app_state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match account {
        Some(account) => Ok(Json(ApiResponse::success(account))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// Get transactions for an account
#[utoipa::path(
    get,
    path = "/api/accounts/{id}/transactions",
    params(
        ("id" = String, Path, description = "Account ID")
    ),
    responses(
        (status = 200, description = "List of transactions", body = Vec<Transaction>),
        (status = 404, description = "Account not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_account_transactions(
    State(app_state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Vec<Transaction>>>, StatusCode> {
    let transactions = sqlx::query_as::<_, Transaction>(
        "SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC, created_at DESC"
    )
    .bind(&id)
    .fetch_all(&app_state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(transactions)))
}

/// Create a new transaction
#[utoipa::path(
    post,
    path = "/api/transactions",
    request_body = CreateTransactionRequest,
    responses(
        (status = 201, description = "Transaction created successfully", body = Transaction),
        (status = 400, description = "Invalid request data"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn create_transaction(
    State(app_state): State<AppState>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<Json<ApiResponse<Transaction>>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        INSERT INTO transactions (id, account_id, amount, description, transaction_date, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&id)
    .bind(&payload.account_id)
    .bind(payload.amount)
    .bind(&payload.description)
    .bind(&payload.transaction_date)
    .bind(&payload.category)
    .bind(now)
    .fetch_one(&app_state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse::success(transaction)))
}

/// Trigger manual sync with SimpleFin
#[utoipa::path(
    post,
    path = "/api/sync",
    responses(
        (status = 200, description = "Sync completed successfully", body = SyncStats),
        (status = 500, description = "Sync failed")
    )
)]
pub async fn trigger_sync(
    State(app_state): State<AppState>,
) -> Result<Json<ApiResponse<SyncStats>>, StatusCode> {
    let sync_service = app_state.sync_service.as_ref()
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?;
    
    match sync_service.sync_all().await {
        Ok(stats) => Ok(Json(ApiResponse::success(stats))),
        Err(e) => {
            tracing::error!("Manual sync failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}