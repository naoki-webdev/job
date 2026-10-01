class AddAiAnalysisStateUpdatedAtToJobs < ActiveRecord::Migration[8.0]
  def change
    add_column :jobs, :ai_analysis_state_updated_at, :datetime
  end
end
