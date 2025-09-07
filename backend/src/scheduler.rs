use tokio::time::{interval, Duration};
use anyhow::Result;
use std::sync::Arc;

use crate::sync::SyncService;

pub struct SyncScheduler {
    sync_service: Arc<SyncService>,
    interval_duration: Duration,
}

impl SyncScheduler {
    pub fn new(sync_service: Arc<SyncService>, interval_minutes: u64) -> Self {
        Self {
            sync_service,
            interval_duration: Duration::from_secs(interval_minutes * 60),
        }
    }

    pub async fn start_background_sync(&self) -> Result<()> {
        let sync_service = self.sync_service.clone();
        let interval_duration = self.interval_duration;

        tokio::spawn(async move {
            let mut ticker = interval(interval_duration);
            
            loop {
                ticker.tick().await;
                
                tracing::info!("Starting scheduled SimpleFin sync...");
                
                match sync_service.sync_all().await {
                    Ok(stats) => {
                        tracing::info!(
                            "Scheduled sync completed successfully: {} accounts created, {} accounts updated, {} transactions created",
                            stats.accounts_created,
                            stats.accounts_updated,
                            stats.transactions_created
                        );
                    }
                    Err(e) => {
                        tracing::error!("Scheduled sync failed: {}", e);
                        // Continue running despite errors - we'll try again next interval
                    }
                }
            }
        });

        tracing::info!(
            "Background sync scheduler started with interval of {} minutes", 
            interval_duration.as_secs() / 60
        );

        Ok(())
    }
}

pub async fn perform_initial_sync(sync_service: &SyncService) -> Result<()> {
    tracing::info!("Performing initial SimpleFin sync...");
    
    match sync_service.sync_all().await {
        Ok(stats) => {
            tracing::info!(
                "Initial sync completed: {} accounts created, {} accounts updated, {} transactions created in {}ms",
                stats.accounts_created,
                stats.accounts_updated,
                stats.transactions_created,
                stats.sync_duration_ms
            );
            Ok(())
        }
        Err(e) => {
            tracing::warn!("Initial sync failed, but server will continue: {}", e);
            // Don't fail server startup if initial sync fails
            // The background scheduler will retry
            Ok(())
        }
    }
}