class AddAiAnalysisStatusToJobs < ActiveRecord::Migration[8.0]
  def change
    add_column :jobs, :ai_analysis_status, :string, null: false, default: "idle"
    add_column :jobs, :ai_analysis_input_digest, :string
    add_column :jobs, :ai_analysis_error, :text

    add_index :job_ai_evaluations,
      [ :job_id, :user_id, :model, :prompt_version, :input_digest ],
      name: "index_job_ai_evaluations_on_current_input"
  end
end
