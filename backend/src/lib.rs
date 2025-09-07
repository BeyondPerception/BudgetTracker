pub mod database;
pub mod handlers;
pub mod models;
pub mod simplefin;
pub mod sync;
pub mod scheduler;
pub mod app_state;

use utoipa::OpenApi;

use crate::models::*;
use crate::sync::SyncStats;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::get_accounts,
        handlers::create_account,
        handlers::get_account,
        handlers::get_account_transactions,
        handlers::create_transaction,
        handlers::trigger_sync,
    ),
    components(
        schemas(Account, CreateAccountRequest, Transaction, CreateTransactionRequest, BalanceHistory, SyncStats)
    ),
    tags(
        (name = "accounts", description = "Account management endpoints"),
        (name = "transactions", description = "Transaction management endpoints"),
        (name = "sync", description = "Data synchronization endpoints")
    ),
    info(
        title = "Budget Tracker API",
        description = "API for managing accounts and transactions in a budget tracker application with SimpleFin integration",
        version = "1.0.0"
    )
)]
pub struct ApiDoc;