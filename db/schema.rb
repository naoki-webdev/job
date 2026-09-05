# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_08_22_090000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", precision: nil, null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activity_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "action", null: false
    t.string "resource_type", null: false
    t.bigint "resource_id"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["resource_type", "resource_id"], name: "index_activity_logs_on_resource_type_and_resource_id"
    t.index ["user_id", "created_at"], name: "index_activity_logs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_activity_logs_on_user_id"
  end

  create_table "interview_questions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "body", limit: 500, null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "display_order"], name: "index_interview_questions_on_user_id_and_display_order"
    t.index ["user_id"], name: "index_interview_questions_on_user_id"
  end

  create_table "job_tech_stacks", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "tech_stack_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id", "tech_stack_id"], name: "index_job_tech_stacks_on_job_id_and_tech_stack_id", unique: true
    t.index ["job_id"], name: "index_job_tech_stacks_on_job_id"
    t.index ["tech_stack_id"], name: "index_job_tech_stacks_on_tech_stack_id"
  end

  create_table "jobs", force: :cascade do |t|
    t.string "company_name", null: false
    t.string "status", default: "interested", null: false
    t.string "work_style", default: "hybrid", null: false
    t.string "employment_type", default: "full_time", null: false
    t.integer "salary_min", default: 0, null: false
    t.integer "salary_max", default: 0, null: false
    t.text "notes", default: "", null: false
    t.integer "score", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "position_id", null: false
    t.bigint "location_id", null: false
    t.bigint "user_id", null: false
    t.string "source_url"
    t.index ["created_at"], name: "index_jobs_on_created_at"
    t.index ["location_id"], name: "index_jobs_on_location_id"
    t.index ["position_id"], name: "index_jobs_on_position_id"
    t.index ["score"], name: "index_jobs_on_score"
    t.index ["status"], name: "index_jobs_on_status"
    t.index ["user_id"], name: "index_jobs_on_user_id"
    t.index ["work_style"], name: "index_jobs_on_work_style"
  end

  create_table "locations", force: :cascade do |t|
    t.string "name", null: false
    t.integer "score_weight", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["active"], name: "index_locations_on_active"
    t.index ["display_order"], name: "index_locations_on_display_order"
    t.index ["user_id", "name"], name: "index_locations_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_locations_on_user_id"
  end

  create_table "negative_keywords", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "pattern", null: false
    t.string "label", null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "display_order"], name: "index_negative_keywords_on_user_id_and_display_order"
    t.index ["user_id", "pattern"], name: "index_negative_keywords_on_user_id_and_pattern", unique: true
    t.index ["user_id"], name: "index_negative_keywords_on_user_id"
  end

  create_table "positions", force: :cascade do |t|
    t.string "name", null: false
    t.integer "score_weight", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["active"], name: "index_positions_on_active"
    t.index ["display_order"], name: "index_positions_on_display_order"
    t.index ["user_id", "name"], name: "index_positions_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_positions_on_user_id"
  end

  create_table "positive_keywords", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "pattern", null: false
    t.string "label", null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "display_order"], name: "index_positive_keywords_on_user_id_and_display_order"
    t.index ["user_id", "pattern"], name: "index_positive_keywords_on_user_id_and_pattern", unique: true
    t.index ["user_id"], name: "index_positive_keywords_on_user_id"
  end

  create_table "scoring_preferences", force: :cascade do |t|
    t.integer "full_remote_weight", default: 30, null: false
    t.integer "hybrid_weight", default: 15, null: false
    t.integer "onsite_weight", default: 0, null: false
    t.integer "high_salary_max_threshold", default: 8000000, null: false
    t.integer "high_salary_bonus", default: 10, null: false
    t.integer "low_salary_min_threshold", default: 4000000, null: false
    t.integer "low_salary_penalty", default: -10, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_scoring_preferences_on_user_id", unique: true
  end

  create_table "tech_stacks", force: :cascade do |t|
    t.string "name", null: false
    t.integer "score_weight", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["active"], name: "index_tech_stacks_on_active"
    t.index ["display_order"], name: "index_tech_stacks_on_display_order"
    t.index ["user_id", "name"], name: "index_tech_stacks_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_tech_stacks_on_user_id"
  end

  create_table "user_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_user_sessions_on_expires_at"
    t.index ["token_digest"], name: "index_user_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_user_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "read_only", default: false, null: false
    t.boolean "ai_enabled", default: false, null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activity_logs", "users"
  add_foreign_key "interview_questions", "users"
  add_foreign_key "job_tech_stacks", "jobs"
  add_foreign_key "job_tech_stacks", "tech_stacks"
  add_foreign_key "jobs", "locations"
  add_foreign_key "jobs", "positions"
  add_foreign_key "jobs", "users"
  add_foreign_key "locations", "users"
  add_foreign_key "negative_keywords", "users"
  add_foreign_key "positions", "users"
  add_foreign_key "positive_keywords", "users"
  add_foreign_key "scoring_preferences", "users"
  add_foreign_key "tech_stacks", "users"
  add_foreign_key "user_sessions", "users"
end
