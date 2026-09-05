class ScopeMasterDataToUsers < ActiveRecord::Migration[8.0]
  MASTER_TABLES = %w[positions locations tech_stacks].freeze

  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  class MigrationJob < ActiveRecord::Base
    self.table_name = "jobs"
  end

  class MigrationJobTechStack < ActiveRecord::Base
    self.table_name = "job_tech_stacks"
  end

  def up
    MASTER_TABLES.each do |table_name|
      add_reference table_name, :user, foreign_key: true
      remove_index table_name, name: "index_#{table_name}_on_name"
    end

    MASTER_TABLES.each do |table_name|
      scope_records_to_users(table_name)
      add_index table_name, [ :user_id, :name ], unique: true
      change_column_null table_name, :user_id, false
    end
  end

  def down
    MASTER_TABLES.each do |table_name|
      remove_index table_name, column: [ :user_id, :name ]
      add_index table_name, :name, unique: true
      remove_reference table_name, :user, foreign_key: true
    end
  end

  private

  def scope_records_to_users(table_name)
    records = connection.select_all("SELECT * FROM #{table_name} ORDER BY id")
    records.each do |attributes|
      record_id = attributes.fetch("id")
      user_ids = referenced_user_ids(table_name, record_id)
      user_ids = [ fallback_user_id ] if user_ids.empty?

      original_user_id = user_ids.shift
      connection.execute(<<~SQL.squish)
        UPDATE #{table_name}
        SET user_id = #{original_user_id}
        WHERE id = #{record_id}
      SQL

      user_ids.each do |user_id|
        duplicate_id = duplicate_record(table_name, attributes, user_id)
        reassign_references(table_name, record_id, duplicate_id, user_id)
      end
    end
  end

  def referenced_user_ids(table_name, record_id)
    case table_name
    when "positions"
      MigrationJob.where(position_id: record_id).distinct.order(:user_id).pluck(:user_id)
    when "locations"
      MigrationJob.where(location_id: record_id).distinct.order(:user_id).pluck(:user_id)
    when "tech_stacks"
      MigrationJobTechStack.joins("INNER JOIN jobs ON jobs.id = job_tech_stacks.job_id")
        .where(tech_stack_id: record_id).distinct.order("jobs.user_id").pluck("jobs.user_id")
    end
  end

  def duplicate_record(table_name, attributes, user_id)
    values = attributes.except("id", "user_id", "created_at", "updated_at")
      .merge("user_id" => user_id, "created_at" => attributes["created_at"], "updated_at" => attributes["updated_at"])
    columns = values.keys
    quoted_columns = columns.map { |column| connection.quote_column_name(column) }.join(", ")
    quoted_values = columns.map { |column| connection.quote(values[column]) }.join(", ")

    result = connection.select_one(<<~SQL.squish)
      INSERT INTO #{table_name} (#{quoted_columns})
      VALUES (#{quoted_values})
      RETURNING id
    SQL
    result.fetch("id")
  end

  def reassign_references(table_name, original_id, duplicate_id, user_id)
    case table_name
    when "positions"
      MigrationJob.where(position_id: original_id, user_id: user_id).update_all(position_id: duplicate_id)
    when "locations"
      MigrationJob.where(location_id: original_id, user_id: user_id).update_all(location_id: duplicate_id)
    when "tech_stacks"
      MigrationJobTechStack.joins("INNER JOIN jobs ON jobs.id = job_tech_stacks.job_id")
        .where(tech_stack_id: original_id, jobs: { user_id: user_id })
        .update_all(tech_stack_id: duplicate_id)
    end
  end

  def fallback_user_id
    email = ENV.fetch("DEMO_USER_EMAIL", "demo@example.com").downcase
    MigrationUser.where("lower(email) = ?", email).pick(:id) || MigrationUser.order(:id).pick(:id)
  end
end
