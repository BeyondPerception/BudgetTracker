use sqlx::SqlitePool;
use std::sync::Arc;

use crate::sync::SyncService;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub sync_service: Option<Arc<SyncService>>,
}

impl AppState {
    pub fn new(pool: SqlitePool, sync_service: Option<Arc<SyncService>>) -> Self {
        Self {
            pool,
            sync_service,
        }
    }
}