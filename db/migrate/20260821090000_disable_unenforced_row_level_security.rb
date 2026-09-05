class DisableUnenforcedRowLevelSecurity < ActiveRecord::Migration[8.0]
  TABLES = %w[
    schema_migrations
    ar_internal_metadata
    users
    jobs
    positions
    locations
    tech_stacks
    job_tech_stacks
    scoring_preferences
    positive_keywords
    negative_keywords
    interview_questions
    activity_logs
    active_storage_blobs
    active_storage_attachments
    active_storage_variant_records
    solid_cache_entries
    solid_cable_messages
    solid_queue_blocked_executions
    solid_queue_claimed_executions
    solid_queue_failed_executions
    solid_queue_jobs
    solid_queue_pauses
    solid_queue_processes
    solid_queue_ready_executions
    solid_queue_recurring_executions
    solid_queue_recurring_tasks
    solid_queue_scheduled_executions
    solid_queue_semaphores
  ].freeze

  def up
    set_row_level_security(enabled: false)
  end

  def down
    set_row_level_security(enabled: true)
  end

  private

  def set_row_level_security(enabled:)
    TABLES.each do |table_name|
      action = enabled ? "ENABLE" : "DISABLE"
      execute "ALTER TABLE IF EXISTS public.#{table_name} #{action} ROW LEVEL SECURITY"
    end
  end
end
