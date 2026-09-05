class CreateEvaluationRules < ActiveRecord::Migration[8.0]
  def change
    create_table :positive_keywords do |t|
      t.references :user, null: false, foreign_key: true
      t.string :pattern, null: false
      t.string :label, null: false
      t.boolean :active, default: true, null: false
      t.integer :display_order, default: 0, null: false
      t.timestamps
    end
    add_index :positive_keywords, [ :user_id, :display_order ]
    add_index :positive_keywords, [ :user_id, :pattern ], unique: true

    create_table :negative_keywords do |t|
      t.references :user, null: false, foreign_key: true
      t.string :pattern, null: false
      t.string :label, null: false
      t.boolean :active, default: true, null: false
      t.integer :display_order, default: 0, null: false
      t.timestamps
    end
    add_index :negative_keywords, [ :user_id, :display_order ]
    add_index :negative_keywords, [ :user_id, :pattern ], unique: true

    create_table :interview_questions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :body, null: false, limit: 500
      t.boolean :active, default: true, null: false
      t.integer :display_order, default: 0, null: false
      t.timestamps
    end
    add_index :interview_questions, [ :user_id, :display_order ]

    reversible do |dir|
      dir.up do
        %w[positive_keywords negative_keywords interview_questions].each do |table_name|
          execute "ALTER TABLE IF EXISTS public.#{table_name} ENABLE ROW LEVEL SECURITY"
        end
      end

      dir.down do
        %w[positive_keywords negative_keywords interview_questions].each do |table_name|
          execute "ALTER TABLE IF EXISTS public.#{table_name} DISABLE ROW LEVEL SECURITY"
        end
      end
    end
  end
end
