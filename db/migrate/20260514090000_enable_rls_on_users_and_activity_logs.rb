class EnableRlsOnUsersAndActivityLogs < ActiveRecord::Migration[8.0]
  TABLES = %w[
    users
    activity_logs
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
