class EnableRowLevelSecurity < ActiveRecord::Migration[8.0]
  TABLES = %w[
    jobs
    positions
    locations
    tech_stacks
    job_tech_stacks
    scoring_preferences
    schema_migrations
    ar_internal_metadata
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
    TABLES.each do |table_name|
      execute %(ALTER TABLE IF EXISTS public.#{table_name} ENABLE ROW LEVEL SECURITY)
    end
  end

  def down
    TABLES.each do |table_name|
      execute %(ALTER TABLE IF EXISTS public.#{table_name} DISABLE ROW LEVEL SECURITY)
    end
  end
end
