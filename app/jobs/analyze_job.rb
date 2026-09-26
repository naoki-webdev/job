class AnalyzeJob < ApplicationJob
  queue_as :default

  def perform(job_id, user_id)
    job = Job.find(job_id)
    user = User.find(user_id)
    input_digest = JobAnalysis::Analyzer.input_digest_for(job: job, user: user)
    queued_digest = job.ai_analysis_input_digest

    if queued_digest != input_digest
      Job.where(
        id: job.id,
        ai_analysis_status: "queued",
        ai_analysis_input_digest: queued_digest
      ).update_all(ai_analysis_status: "idle", ai_analysis_input_digest: nil, ai_analysis_error: nil)
      return
    end

    return unless Job.where(
      id: job.id,
      ai_analysis_status: "queued",
      ai_analysis_input_digest: input_digest
    ).update_all(ai_analysis_status: "running", ai_analysis_error: nil) == 1

    evaluation = JobAnalysis::EvaluationRunner.call(job: job, user: user)
    current_digest = JobAnalysis::Analyzer.input_digest_for(job: job, user: user)
    if current_digest != input_digest
      Job.where(
        id: job.id,
        ai_analysis_status: "running",
        ai_analysis_input_digest: input_digest
      ).update_all(ai_analysis_status: "idle", ai_analysis_input_digest: nil, ai_analysis_error: nil)
      return
    end

    completed = Job.where(
      id: job.id,
      ai_analysis_status: "running",
      ai_analysis_input_digest: input_digest
    ).update_all(
      ai_analysis_status: "completed",
      ai_analysis_input_digest: evaluation.input_digest,
      ai_analysis_error: nil
    )
    return unless completed == 1

    user.activity_logs.create!(
      action: "job.ai_analyze",
      resource_type: job.class.name,
      resource_id: job.id,
      metadata: { evaluation_id: evaluation.id, verdict: evaluation.verdict }
    )
  rescue JobAnalysis::AiAnalyzer::Error => error
    mark_failed(job, input_digest, "AI判定サービスを利用できません。時間をおいて再試行してください。")
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
    mark_failed(job, input_digest, "AI判定に失敗しました。時間をおいて再試行してください。")
    raise
  end

  private

  def mark_failed(job, input_digest, message)
    return unless job && input_digest

    Job.where(
      id: job.id,
      ai_analysis_status: "running",
      ai_analysis_input_digest: input_digest
    ).update_all(ai_analysis_status: "failed", ai_analysis_error: message)
  end
end
