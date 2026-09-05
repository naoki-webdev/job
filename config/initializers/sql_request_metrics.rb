ActiveSupport::Notifications.subscribe("sql.active_record") do |*args|
  event = ActiveSupport::Notifications::Event.new(*args)
  payload = event.payload

  next if payload[:name] == "SCHEMA" || payload[:cached]
  next if Current.request_id.blank?

  Current.db_duration_ms += event.duration
end
