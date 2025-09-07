use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub institution: String,
    pub account_type: String,
    pub balance: f64,
    #[schema(value_type = String, format = DateTime)]
    pub last_updated: DateTime<Utc>,
    #[schema(value_type = String, format = DateTime)]
    pub created_at: DateTime<Utc>,
    // SimpleFin integration fields
    pub simplefin_id: Option<String>,
    pub available_balance: Option<f64>,
    pub is_credit_card: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateAccountRequest {
    pub name: String,
    pub institution: String,
    pub account_type: String,
    pub balance: f64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct Transaction {
    pub id: String,
    pub account_id: String,
    pub amount: f64,
    pub description: String,
    #[schema(value_type = String, format = Date)]
    pub transaction_date: NaiveDate,
    pub category: Option<String>,
    #[schema(value_type = String, format = DateTime)]
    pub created_at: DateTime<Utc>,
    // SimpleFin integration fields
    pub simplefin_id: Option<String>,
    #[schema(value_type = String, format = DateTime)]
    pub posted_date: Option<DateTime<Utc>>,
    pub payee: Option<String>,
    pub memo: Option<String>,
    pub pending: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateTransactionRequest {
    pub account_id: String,
    pub amount: f64,
    pub description: String,
    #[schema(value_type = String, format = Date)]
    pub transaction_date: NaiveDate,
    pub category: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct BalanceHistory {
    pub id: String,
    pub account_id: String,
    pub balance: f64,
    #[schema(value_type = String, format = DateTime)]
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}