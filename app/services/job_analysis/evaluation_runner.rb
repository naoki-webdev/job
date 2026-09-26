module JobAnalysis
  class EvaluationRunner
    def self.call(job:, user:)
      new(job: job, user: user).call
    end

    def self.cached(job:, user:)
      new(job: job, user: user).cached
    end

    def initialize(job:, user:)
      @job = job
      @user = user
    end

    def call
      Analyzer.new(job: @job, user: @user).validate_input!
      cached || create_evaluation
    end

    def cached
      @job.job_ai_evaluations.find_by(
        user_id: @user.id,
        model: AiAnalyzer::MODEL,
        prompt_version: Analyzer::PROMPT_VERSION,
        input_digest: input_digest
      )
    end

    private

    def create_evaluation
      result = Analyzer.new(job: @job, user: @user).call
      @job.job_ai_evaluations.create!(
        user: @user,
        verdict: result.fetch("verdict"),
        summary: result.fetch("summary"),
        result_json: result.except("model", "prompt_version", "input_digest", "evaluated_at"),
        model: result.fetch("model"),
        prompt_version: result.fetch("prompt_version"),
        input_digest: result.fetch("input_digest"),
        evaluated_at: result.fetch("evaluated_at")
      )
    rescue ActiveRecord::RecordNotUnique
      cached || raise
    end

    def input_digest
      Analyzer.input_digest_for(job: @job, user: @user)
    end
  end
end
