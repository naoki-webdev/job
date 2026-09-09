class AddJobAiAnalysis < ActiveRecord::Migration[8.0]
  def change
    add_column :jobs, :source_text, :text, null: false, default: ""

    create_table :job_ai_evaluations do |t|
      t.references :job, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :verdict, null: false
      t.text :summary, null: false, default: ""
      t.jsonb :result_json, null: false, default: {}
      t.string :model, null: false
      t.string :prompt_version, null: false
      t.string :input_digest, null: false
      t.datetime :evaluated_at, null: false

      t.timestamps
    end

    add_index :job_ai_evaluations, [ :job_id, :evaluated_at ]
    add_index :job_ai_evaluations, :input_digest
  end
end
