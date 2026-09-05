# This migration comes from active_storage (originally 20170806125915)
class CreateActiveStorageTables < ActiveRecord::Migration[8.0]
  TABLES = %w[
    active_storage_blobs
    active_storage_attachments
    active_storage_variant_records
  ].freeze

  def change
    create_table :active_storage_blobs do |t|
      t.string   :key,          null: false
      t.string   :filename,     null: false
      t.string   :content_type
      t.text     :metadata
      t.string   :service_name, null: false
      t.bigint   :byte_size,    null: false
      t.string   :checksum

      t.datetime :created_at, precision: nil, null: false

      t.index [ :key ], unique: true
    end

    create_table :active_storage_attachments do |t|
      t.string     :name,     null: false
      t.references :record,   null: false, polymorphic: true, index: false
      t.references :blob,     null: false

      t.datetime :created_at, precision: nil, null: false

      t.index [ :record_type, :record_id, :name, :blob_id ], name: :index_active_storage_attachments_uniqueness, unique: true
      t.foreign_key :active_storage_blobs, column: :blob_id
    end

    create_table :active_storage_variant_records do |t|
      t.belongs_to :blob, null: false, index: false
      t.string :variation_digest, null: false

      t.index [ :blob_id, :variation_digest ], name: :index_active_storage_variant_records_uniqueness, unique: true
      t.foreign_key :active_storage_blobs, column: :blob_id
    end

    reversible do |dir|
      dir.up do
        TABLES.each do |table_name|
          execute %(ALTER TABLE IF EXISTS public.#{table_name} ENABLE ROW LEVEL SECURITY)
        end
      end

      dir.down do
        TABLES.each do |table_name|
          execute %(ALTER TABLE IF EXISTS public.#{table_name} DISABLE ROW LEVEL SECURITY)
        end
      end
    end
  end
end
