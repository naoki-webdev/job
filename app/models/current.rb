class Current < ActiveSupport::CurrentAttributes
  attribute :request_id, :user_id
  attribute :db_duration_ms, default: 0.0
end
