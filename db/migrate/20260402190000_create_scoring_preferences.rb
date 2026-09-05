class CreateScoringPreferences < ActiveRecord::Migration[8.0]
  def change
    create_table :scoring_preferences do |t|
      t.integer :full_remote_weight, null: false, default: 30
      t.integer :hybrid_weight, null: false, default: 15
      t.integer :onsite_weight, null: false, default: 0
      t.integer :high_salary_max_threshold, null: false, default: 8_000_000
      t.integer :high_salary_bonus, null: false, default: 10
      t.integer :low_salary_min_threshold, null: false, default: 4_000_000
      t.integer :low_salary_penalty, null: false, default: -10

      t.timestamps
    end
  end
end
