class AnalyzeJob < ApplicationJob
  queue_as :default

  def perform(job_id, user_id, queued_at = nil)
    job = Job.find(job_id)
    return if queued_at.nil? && job.ai_analysis_state_updated_at.present?

    queued_at ||= job.ai_analysis_state_updated_at
    input_digest = nil
    running_at = nil
    queued_digest = job.ai_analysis_input_digest
    user = User.find(user_id)
    input_digest = JobAnalysis::Analyzer.input_digest_for(job: job, user: user)

    if queued_digest != input_digest
      Job.where(
        id: job.id,
        ai_analysis_status: "queued",
        ai_analysis_input_digest: queued_digest,
        ai_analysis_state_updated_at: queued_at
      ).update_all(ai_analysis_status: "idle", ai_analysis_input_digest: nil, ai_analysis_error: nil, ai_analysis_state_updated_at: Time.current)
      return
    end

    running_at = Time.current
    return unless Job.where(
      id: job.id,
      ai_analysis_status: "queued",
      ai_analysis_input_digest: input_digest,
      ai_analysis_state_updated_at: queued_at
    ).update_all(ai_analysis_status: "running", ai_analysis_error: nil, ai_analysis_state_updated_at: running_at) == 1

    evaluation = JobAnalysis::EvaluationRunner.call(job: job, user: user)
    current_digest = JobAnalysis::Analyzer.input_digest_for(job: job, user: user)
    if current_digest != input_digest
      Job.where(
        id: job.id,
        ai_analysis_status: "running",
        ai_analysis_input_digest: input_digest,
        ai_analysis_state_updated_at: running_at
      ).update_all(ai_analysis_status: "idle", ai_analysis_input_digest: nil, ai_analysis_error: nil, ai_analysis_state_updated_at: Time.current)
      return
    end

    completed = Job.where(
      id: job.id,
      ai_analysis_status: "running",
      ai_analysis_input_digest: input_digest,
      ai_analysis_state_updated_at: running_at
    ).update_all(
      ai_analysis_status: "completed",
      ai_analysis_input_digest: evaluation.input_digest,
      ai_analysis_error: nil,
      ai_analysis_state_updated_at: Time.current
    )
    return unless completed == 1

    user.activity_logs.create!(
      action: "job.ai_analyze",
      resource_type: job.class.name,
      resource_id: job.id,
      metadata: { evaluation_id: evaluation.id, verdict: evaluation.verdict }
    )
  rescue JobAnalysis::AiAnalyzer::Error => error
    mark_failed(job, input_digest || queued_digest, queued_at, running_at, "AI判定サービスを利用できません。時間をおいて再試行してください。")
    Rails.logger.warn(
      {
        event: "job_ai_analysis_failed",
        service: "gemini",
        job_id: job_id,
        user_id: user_id,
        error_class: error.class.name
      }.to_json
    )
  rescue StandardError
    mark_failed(job, input_digest || queued_digest, queued_at, running_at, "AI判定に失敗しました。時間をおいて再試行してください。")
    raise
  end

  private

  def mark_failed(job, input_digest, queued_at, running_at, message)
    return unless job && input_digest

    Job.where(
      id: job.id,
      ai_analysis_status: running_at ? "running" : "queued",
      ai_analysis_input_digest: input_digest,
      ai_analysis_state_updated_at: running_at || queued_at
    ).update_all(ai_analysis_status: "failed", ai_analysis_error: message, ai_analysis_state_updated_at: Time.current)
  end
end
