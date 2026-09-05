require "bcrypt"
require "securerandom"

class CreateUsersAndScopeOwnedRecords < ActiveRecord::Migration[8.0]
  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  def up
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.boolean :read_only, null: false, default: false
      t.boolean :ai_enabled, null: false, default: false

      t.timestamps
    end

    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"

    add_column :jobs, :source_url, :string
    add_reference :jobs, :user, foreign_key: true
    add_reference :scoring_preferences, :user, foreign_key: true, index: { unique: true }

    demo_user = MigrationUser.create!(
      name: "デモユーザー",
      email: demo_email,
      password_digest: BCrypt::Password.create(demo_password),
      read_only: true,
      ai_enabled: false
    )

    execute "UPDATE jobs SET user_id = #{demo_user.id} WHERE user_id IS NULL"

    scoring_preference_ids = select_values("SELECT id FROM scoring_preferences ORDER BY id ASC")
    if scoring_preference_ids.empty?
      execute <<~SQL.squish
        INSERT INTO scoring_preferences (
          user_id,
          full_remote_weight,
          hybrid_weight,
          onsite_weight,
          high_salary_max_threshold,
          high_salary_bonus,
          low_salary_min_threshold,
          low_salary_penalty,
          created_at,
          updated_at
        )
        VALUES (
          #{demo_user.id},
          30,
          15,
          0,
          8000000,
          10,
          4000000,
          -10,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      SQL
    else
      scoring_preference_ids.each_with_index do |preference_id, index|
        owner = index.zero? ? demo_user : MigrationUser.create!(
          name: "移行ユーザー #{preference_id}",
          email: "legacy-preference-#{preference_id}@example.com",
          password_digest: BCrypt::Password.create(SecureRandom.hex(24))
        )

        execute "UPDATE scoring_preferences SET user_id = #{owner.id} WHERE id = #{preference_id}"
      end
    end

    change_column_null :jobs, :user_id, false
    change_column_null :scoring_preferences, :user_id, false
  end

  def down
    remove_reference :scoring_preferences, :user, foreign_key: true
    remove_reference :jobs, :user, foreign_key: true
    remove_column :jobs, :source_url
    drop_table :users
  end

  private

  def demo_email
    ENV.fetch("DEMO_USER_EMAIL", "demo@example.com")
  end

  def demo_password
    ENV.fetch("DEMO_USER_PASSWORD", "password")
  end
end
