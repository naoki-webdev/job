class AddWorkspaceFieldsToJobs < ActiveRecord::Migration[8.0]
  def change
    add_column :jobs, :next_action, :string, limit: 500
    add_column :jobs, :action_due_on, :date
    add_column :jobs, :interview_at, :datetime
    add_column :jobs, :discarded_at, :datetime
    add_index :jobs, [ :user_id, :discarded_at ]
  end
end
