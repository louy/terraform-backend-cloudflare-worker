terraform {
  backend "http" {
    address = "https://terraform-backend-cloudflare-worker.ACCOUNT_NAME.workers.dev/"
    username = "CHANGE ME!"
    password = "CHANGE ME!"
    
    # Optional
    lock_address = "https://terraform-backend-cloudflare-worker.ACCOUNT_NAME.workers.dev/"
    unlock_address = "https://terraform-backend-cloudflare-worker.ACCOUNT_NAME.workers.dev/"
  }
}
