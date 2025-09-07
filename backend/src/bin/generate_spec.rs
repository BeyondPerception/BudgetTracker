use utoipa::OpenApi;
use std::fs;

use budget_tracker_backend::ApiDoc;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let spec = ApiDoc::openapi().to_pretty_json()?;
    
    // Ensure target directory exists
    fs::create_dir_all("target")?;
    
    // Write spec to file
    fs::write("target/openapi.json", spec)?;
    
    println!("✅ OpenAPI spec generated at target/openapi.json");
    
    Ok(())
}