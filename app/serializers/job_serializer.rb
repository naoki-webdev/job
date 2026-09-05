class JobSerializer
  MASTER_DATA_FIELDS = %i[id name score_weight active display_order].freeze

  def self.collection(jobs, url_options: nil)
    jobs.map { |job| new(job, url_options: url_options).as_json }
  end

  def initialize(job, url_options: nil)
    @job = job
    @url_options = url_options
  end

  def as_json(*)
    {
      "id" => @job.id,
      "company_name" => @job.company_name,
      "position_id" => @job.position_id,
      "position" => @job.position_name,
      "status" => @job.status,
      "work_style" => @job.work_style,
      "employment_type" => @job.employment_type,
      "salary_min" => @job.salary_min,
      "salary_max" => @job.salary_max,
      "location_id" => @job.location_id,
      "tech_stack_ids" => @job.tech_stack_ids,
      "tech_stack" => @job.tech_stack_names,
      "location" => @job.location_name,
      "notes" => @job.notes,
      "source_url" => @job.source_url,
      "company_logo_url" => company_logo_url,
      "company_logo_filename" => company_logo_filename,
      "score" => @job.score,
      "created_at" => @job.created_at,
      "updated_at" => @job.updated_at,
      "tech_stacks" => @job.tech_stacks.as_json(only: MASTER_DATA_FIELDS),
      "position_master" => serialize_master(@job.position),
      "location_master" => serialize_master(@job.location)
    }
  end

  private

  def company_logo_url
    return unless @job.company_logo.attached?

    Rails.application.routes.url_helpers.rails_blob_url(@job.company_logo, **(@url_options || {}))
  end

  def company_logo_filename
    return unless @job.company_logo.attached?

    @job.company_logo.filename.to_s
  end

  def serialize_master(record)
    record&.as_json(only: MASTER_DATA_FIELDS)
  end
end
