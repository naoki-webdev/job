class CreateJobs < ActiveRecord::Migration[8.0]
  def change
    create_enum :job_status, %w[interested applied interviewing offer rejected]
    create_enum :job_work_style, %w[full_remote hybrid onsite]
    create_enum :job_employment_type, %w[full_time contract]

    create_table :positions do |t|
      t.string :name, null: false
      t.integer :score_weight, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :display_order, null: false, default: 0

      t.timestamps
    end

    add_index :positions, :name, unique: true
    add_index :positions, :active
    add_index :positions, :display_order

    create_table :locations do |t|
      t.string :name, null: false
      t.integer :score_weight, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :display_order, null: false, default: 0

      t.timestamps
    end

    add_index :locations, :name, unique: true
    add_index :locations, :active
    add_index :locations, :display_order

    create_table :tech_stacks do |t|
      t.string :name, null: false
      t.integer :score_weight, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :display_order, null: false, default: 0

      t.timestamps
    end

    add_index :tech_stacks, :name, unique: true
    add_index :tech_stacks, :active
    add_index :tech_stacks, :display_order

    create_table :jobs do |t|
      t.string :company_name, null: false
      t.enum :status, enum_type: :job_status, null: false, default: "interested"
      t.enum :work_style, enum_type: :job_work_style, null: false, default: "hybrid"
      t.enum :employment_type, enum_type: :job_employment_type, null: false, default: "full_time"
      t.integer :salary_min, null: false, default: 0
      t.integer :salary_max, null: false, default: 0
      t.text :notes, null: false, default: ""
      t.integer :score, null: false, default: 0
      t.references :position, null: false, foreign_key: true
      t.references :location, null: false, foreign_key: true

      t.timestamps
    end

    add_index :jobs, :status
    add_index :jobs, :work_style
    add_index :jobs, :score
    add_index :jobs, :created_at

    create_table :job_tech_stacks do |t|
      t.references :job, null: false, foreign_key: true
      t.references :tech_stack, null: false, foreign_key: true

      t.timestamps
    end

    add_index :job_tech_stacks, [ :job_id, :tech_stack_id ], unique: true
  end
end
