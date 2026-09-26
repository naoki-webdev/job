class JobSerializer
  MASTER_DATA_FIELDS = %i[id name score_weight active display_order].freeze

  def self.collection(jobs, url_options: nil, scoring_preference: nil)
    jobs.map { |job| new(job, url_options: url_options, scoring_preference: scoring_preference).as_json }
  end

  def initialize(job, url_options: nil, include_ai_analysis: false, scoring_preference: nil)
    @job = job
    @url_options = url_options
    @include_ai_analysis = include_ai_analysis
    @scoring_preference = scoring_preference
  end

  def as_json(*)
    payload = {
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
      "score_breakdown" => JobScoreCalculator.new(@job, preference: @scoring_preference).breakdown,
      "ai_analysis_status" => @job.ai_analysis_status,
      "created_at" => @job.created_at,
      "updated_at" => @job.updated_at,
      "tech_stacks" => @job.tech_stacks.as_json(only: MASTER_DATA_FIELDS),
      "position_master" => serialize_master(@job.position),
      "location_master" => serialize_master(@job.location)
    }

    return payload unless @include_ai_analysis

    payload.merge(
      "source_text" => @job.source_text,
      "ai_evaluation" => serialize_ai_evaluation
    )
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

  def serialize_ai_evaluation
    evaluation = current_ai_evaluation || @job.latest_ai_evaluation
    return unless evaluation

    evaluation.result_json.merge(
      "id" => evaluation.id,
      "verdict" => evaluation.verdict,
      "summary" => evaluation.summary,
      "model" => evaluation.model,
      "prompt_version" => evaluation.prompt_version,
      "input_digest" => evaluation.input_digest,
      "stale" => evaluation.stale?,
      "evaluated_at" => evaluation.evaluated_at
    )
  end

  def current_ai_evaluation
    return if @job.ai_analysis_input_digest.blank?

    @job.job_ai_evaluations.find_by(
      input_digest: @job.ai_analysis_input_digest,
      model: JobAnalysis::AiAnalyzer::MODEL,
      prompt_version: JobAnalysis::Analyzer::PROMPT_VERSION
    )
  end
end
