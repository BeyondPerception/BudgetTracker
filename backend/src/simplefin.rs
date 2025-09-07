use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use url::Url;

// SimpleFin API Response Types
#[derive(Debug, Deserialize, Clone)]
pub struct SimplefinTransaction {
    pub id: String,
    pub posted: Option<i64>,
    pub amount: String,
    pub description: String,
    pub payee: Option<String>,
    pub memo: Option<String>,
    pub transacted_at: Option<i64>,
    pub pending: Option<bool>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SimplefinOrganization {
    pub name: Option<String>,
    pub domain: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SimplefinAccount {
    pub id: String,
    pub name: String,
    pub org: Option<SimplefinOrganization>,
    pub balance: String,
    #[serde(rename = "available-balance")]
    pub available_balance_raw: Option<String>,
    #[serde(skip)]
    pub available_balance: f64,
    #[serde(skip)]
    pub is_credit_card: bool,
    pub transactions: Option<Vec<SimplefinTransaction>>,
}

#[derive(Debug, Deserialize)]
pub struct SimplefinAccountSet {
    pub accounts: Vec<SimplefinAccount>,
}

pub struct SimplefinClient {
    client: Client,
    base_url: String,
    username: String,
    password: String,
}

impl SimplefinClient {
    pub fn new(access_url: String) -> Result<Self> {
        let parsed =
            Url::parse(&access_url).map_err(|e| anyhow!("Invalid SimpleFin access URL: {}", e))?;

        let username = parsed.username();
        let password = parsed.password().unwrap_or("");

        if username.is_empty() {
            return Err(anyhow!("SimpleFin access URL must contain username"));
        }

        let base_url = format!(
            "{}://{}{}",
            parsed.scheme(),
            parsed.host_str().unwrap_or(""),
            parsed.path().trim_end_matches('/')
        );

        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()?;

        Ok(Self {
            client,
            base_url,
            username: username.to_string(),
            password: password.to_string(),
        })
    }

    pub async fn fetch_accounts(&self) -> Result<SimplefinAccountSet> {
        let days_back = 30;
        let start_timestamp = (chrono::Utc::now().timestamp() - (days_back * 86_400)) as i64;

        let mut params = HashMap::new();
        params.insert("start-date", start_timestamp.to_string());
        params.insert("pending", "1".to_string());

        let url = format!("{}/accounts", self.base_url);

        tracing::info!("Fetching accounts from SimpleFin: {}", url);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.username, Some(&self.password))
            .query(&params)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to fetch from SimpleFin: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow!("SimpleFin API error {}: {}", status, text));
        }

        let mut account_set: SimplefinAccountSet = response
            .json()
            .await
            .map_err(|e| anyhow!("Failed to parse SimpleFin response: {}", e))?;

        // Post-process accounts to normalize fields and detect credit cards
        for account in &mut account_set.accounts {
            // Parse available balance
            if let Some(ref avail_balance) = account.available_balance_raw {
                account.available_balance = avail_balance.parse::<f64>().unwrap_or(0.0);
            }

            // Detect credit cards: available balance of 0 typically indicates credit card
            account.is_credit_card = account.available_balance == 0.0;
        }

        tracing::info!(
            "Successfully fetched {} accounts from SimpleFin",
            account_set.accounts.len()
        );

        Ok(account_set)
    }
}

impl SimplefinTransaction {
    pub fn to_posted_date(&self) -> Option<DateTime<Utc>> {
        let timestamp = self.posted.or(self.transacted_at)?;
        DateTime::from_timestamp(timestamp, 0)
    }

    pub fn amount_as_f64(&self) -> f64 {
        self.amount.parse::<f64>().unwrap_or(0.0)
    }
}

impl SimplefinAccount {
    pub fn balance_as_f64(&self) -> f64 {
        self.balance.parse::<f64>().unwrap_or(0.0)
    }

    pub fn institution_name(&self) -> String {
        self.org
            .as_ref()
            .and_then(|org| org.name.clone())
            .unwrap_or_else(|| "Unknown".to_string())
    }
}
