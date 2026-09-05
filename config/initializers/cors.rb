allowed_origins =
  if Rails.env.production?
    ENV.fetch("FRONTEND_ORIGIN", "").split(",").map(&:strip).reject(&:empty?)
  else
    [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ]
  end

Rails.application.config.x.frontend_origins = allowed_origins

unless allowed_origins.empty?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*allowed_origins)

      resource "/api/*",
        headers: :any,
        methods: [ :get, :post, :patch, :delete, :options, :head ],
        credentials: true
    end
  end
end
