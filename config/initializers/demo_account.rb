Rails.application.config.x.demo_account.email = ENV.fetch("DEMO_USER_EMAIL", "demo@example.com")
Rails.application.config.x.demo_account.password = ENV.fetch("DEMO_USER_PASSWORD", "password")
