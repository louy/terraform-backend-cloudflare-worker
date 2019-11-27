terraform {
  backend "http" {
    address = "https://terraform-backend-cloudflare-worker.ACCOUNT_NAME.workers.dev/"
    username = "CHANGE ME!"
    password = "CHANGE ME!"
  }
}
