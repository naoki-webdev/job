class JobAiEvaluation < ApplicationRecord
  VERDICTS = %w[recommended conditional not_recommended insufficient_information].freeze

  belongs_to :job
  belongs_to :user

  validates :verdict, inclusion: { in: VERDICTS }
  validates :summary, length: { maximum: 4_000 }
  validates :model, :prompt_version, :input_digest, :evaluated_at, presence: true
  validates :result_json, presence: true

  validate :user_owns_job

  def stale?
    return true if prompt_version != JobAnalysis::Analyzer::PROMPT_VERSION
    return true if model != JobAnalysis::AiAnalyzer::MODEL

    current_digest = JobAnalysis::InputDigest.call(
      source_text: job.source_text,
      source_url: job.source_url,
      preferences: JobAnalysis::PreferenceSnapshot.new(user).call,
      prompt_version: JobAnalysis::Analyzer::PROMPT_VERSION,
      model: JobAnalysis::AiAnalyzer::MODEL
    )
    current_digest != input_digest
  rescue StandardError
    true
  end

  private

  def user_owns_job
    return if job.blank? || user.blank? || job.user_id == user_id

    errors.add(:job, "must belong to the same user")
  end
end
