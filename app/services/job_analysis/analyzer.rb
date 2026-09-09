module JobAnalysis
  class Analyzer
    PROMPT_VERSION = "job-analysis-v1".freeze
    MAX_SOURCE_TEXT_LENGTH = Job::SOURCE_TEXT_MAX_LENGTH

    def initialize(job:, user:)
      @job = job
      @user = user
    end

    def call
      source_text = @job.source_text.to_s.strip
      raise ArgumentError, "source_text is required" if source_text.blank?
      raise ArgumentError, "source_text is too long" if source_text.length > MAX_SOURCE_TEXT_LENGTH

      preferences = PreferenceSnapshot.new(@user).call
      raw = AiAnalyzer.new(
        source_text: source_text,
        source_url: @job.source_url,
        preferences: preferences
      ).call
      result = ResultNormalizer.new(raw: raw, preferences: preferences, source_text: source_text).call

      result.merge(
        "model" => AiAnalyzer::MODEL,
        "prompt_version" => PROMPT_VERSION,
        "input_digest" => InputDigest.call(
          source_text: source_text,
          source_url: @job.source_url,
          preferences: preferences
        ),
        "evaluated_at" => Time.current
      )
    end
  end
end
