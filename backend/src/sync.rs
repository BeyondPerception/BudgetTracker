use sqlx::SqlitePool;
use anyhow::Result;
use chrono::Utc;
use uuid::Uuid;
use serde::{Serialize, Deserialize};
use utoipa::ToSchema;

use crate::simplefin::{SimplefinClient, SimplefinAccount, SimplefinTransaction};
use crate::models::Account;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct SyncStats {
    pub accounts_updated: u32,
    pub accounts_created: u32,
    pub transactions_created: u32,
    pub balance_records_created: u32,
    pub sync_duration_ms: u64,
}

pub struct SyncService {
    pool: SqlitePool,
    simplefin_client: SimplefinClient,
}

impl SyncService {
    pub fn new(pool: SqlitePool, simplefin_access_url: String) -> Result<Self> {
        let simplefin_client = SimplefinClient::new(simplefin_access_url)?;
        Ok(Self {
            pool,
            simplefin_client,
        })
    }

    pub async fn sync_all(&self) -> Result<SyncStats> {
        let start_time = std::time::Instant::now();
        let mut stats = SyncStats {
            accounts_updated: 0,
            accounts_created: 0,
            transactions_created: 0,
            balance_records_created: 0,
            sync_duration_ms: 0,
        };

        tracing::info!("Starting SimpleFin sync...");

        // Fetch account data from SimpleFin
        let account_set = self.simplefin_client.fetch_accounts().await?;

        // Start database transaction
        let mut tx = self.pool.begin().await?;

        for simplefin_account in account_set.accounts {
            // Upsert account
            let (account_created, local_account) = self.upsert_account(&mut tx, &simplefin_account).await?;
            
            if account_created {
                stats.accounts_created += 1;
            } else {
                stats.accounts_updated += 1;
            }

            // Record balance history if balance changed
            if self.record_balance_history(&mut tx, &local_account).await? {
                stats.balance_records_created += 1;
            }

            // Sync transactions if any
            if let Some(transactions) = simplefin_account.transactions {
                for simplefin_tx in transactions {
                    if self.upsert_transaction(&mut tx, &local_account.id, &simplefin_tx).await? {
                        stats.transactions_created += 1;
                    }
                }
            }
        }

        // Commit transaction
        tx.commit().await?;

        stats.sync_duration_ms = start_time.elapsed().as_millis() as u64;

        tracing::info!(
            "SimpleFin sync completed: {} accounts created, {} accounts updated, {} transactions created, {} balance records created in {}ms",
            stats.accounts_created,
            stats.accounts_updated, 
            stats.transactions_created,
            stats.balance_records_created,
            stats.sync_duration_ms
        );

        Ok(stats)
    }

    async fn upsert_account(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        simplefin_account: &SimplefinAccount,
    ) -> Result<(bool, Account)> {
        // Check if account exists
        let existing_account = sqlx::query_as::<_, Account>(
            "SELECT * FROM accounts WHERE simplefin_id = ?"
        )
        .bind(&simplefin_account.id)
        .fetch_optional(&mut **tx)
        .await?;

        let balance = simplefin_account.balance_as_f64();
        let now = Utc::now();

        let account = if let Some(mut existing) = existing_account {
            // Update existing account
            existing.name = simplefin_account.name.clone();
            existing.institution = simplefin_account.institution_name();
            existing.balance = balance;
            existing.available_balance = Some(simplefin_account.available_balance);
            existing.is_credit_card = Some(simplefin_account.is_credit_card);
            existing.last_updated = now;

            sqlx::query(
                r#"
                UPDATE accounts SET 
                    name = ?, institution = ?, balance = ?, available_balance = ?,
                    is_credit_card = ?, last_updated = ?
                WHERE simplefin_id = ?
                "#
            )
            .bind(&existing.name)
            .bind(&existing.institution)
            .bind(existing.balance)
            .bind(existing.available_balance)
            .bind(existing.is_credit_card)
            .bind(existing.last_updated)
            .bind(&simplefin_account.id)
            .execute(&mut **tx)
            .await?;

            (false, existing)
        } else {
            // Create new account
            let id = Uuid::new_v4().to_string();
            let account_type = if simplefin_account.is_credit_card {
                "credit".to_string()
            } else {
                "checking".to_string() // Default assumption
            };

            let new_account = Account {
                id: id.clone(),
                name: simplefin_account.name.clone(),
                institution: simplefin_account.institution_name(),
                account_type,
                balance,
                last_updated: now,
                created_at: now,
                simplefin_id: Some(simplefin_account.id.clone()),
                available_balance: Some(simplefin_account.available_balance),
                is_credit_card: Some(simplefin_account.is_credit_card),
            };

            sqlx::query(
                r#"
                INSERT INTO accounts (id, name, institution, account_type, balance, 
                                    last_updated, created_at, simplefin_id, available_balance, is_credit_card)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(&new_account.id)
            .bind(&new_account.name)
            .bind(&new_account.institution)
            .bind(&new_account.account_type)
            .bind(new_account.balance)
            .bind(new_account.last_updated)
            .bind(new_account.created_at)
            .bind(&new_account.simplefin_id)
            .bind(new_account.available_balance)
            .bind(new_account.is_credit_card)
            .execute(&mut **tx)
            .await?;

            (true, new_account)
        };

        Ok(account)
    }

    async fn record_balance_history(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        account: &Account,
    ) -> Result<bool> {
        // Check if we already have a recent balance record (within last hour)
        let recent_balance = sqlx::query_as::<_, (f64,)>(
            r#"
            SELECT balance FROM balances_history 
            WHERE account_id = ? AND timestamp > datetime('now', '-1 hour')
            ORDER BY timestamp DESC
            LIMIT 1
            "#,
        )
        .bind(&account.id)
        .fetch_optional(&mut **tx)
        .await?;

        // Only record if balance has changed or no recent record exists
        if let Some((recent_balance,)) = recent_balance {
            if (recent_balance - account.balance).abs() < 0.01 {
                return Ok(false); // Balance hasn't changed significantly
            }
        }

        // Record new balance
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO balances_history (id, account_id, balance, timestamp) VALUES (?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&account.id)
        .bind(account.balance)
        .bind(now)
        .execute(&mut **tx)
        .await?;

        Ok(true)
    }

    async fn upsert_transaction(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        account_id: &str,
        simplefin_tx: &SimplefinTransaction,
    ) -> Result<bool> {
        // Check if transaction already exists
        let exists = sqlx::query_as::<_, (String,)>(
            "SELECT id FROM transactions WHERE simplefin_id = ?"
        )
        .bind(&simplefin_tx.id)
        .fetch_optional(&mut **tx)
        .await?
        .is_some();

        if exists {
            return Ok(false); // Transaction already exists
        }

        // Create new transaction
        let id = Uuid::new_v4().to_string();
        let amount = simplefin_tx.amount_as_f64();
        let posted_date = simplefin_tx.to_posted_date();
        let transaction_date = posted_date
            .map(|dt| dt.date_naive())
            .unwrap_or_else(|| Utc::now().date_naive());
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO transactions (
                id, account_id, amount, description, transaction_date, created_at,
                simplefin_id, posted_date, payee, memo, pending
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(account_id)
        .bind(amount)
        .bind(&simplefin_tx.description)
        .bind(transaction_date)
        .bind(now)
        .bind(&simplefin_tx.id)
        .bind(posted_date)
        .bind(&simplefin_tx.payee)
        .bind(&simplefin_tx.memo)
        .bind(simplefin_tx.pending.unwrap_or(false))
        .execute(&mut **tx)
        .await?;

        Ok(true)
    }
}