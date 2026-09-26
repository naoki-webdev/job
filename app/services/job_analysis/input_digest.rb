require "digest"
require "json"

module JobAnalysis
  class InputDigest
    def self.call(source_text:, source_url: nil, preferences:, prompt_version: nil, model: nil)
      Digest::SHA256.hexdigest([
        (prompt_version || Analyzer::PROMPT_VERSION).to_s,
        (model || AiAnalyzer::MODEL).to_s,
        source_text.to_s.strip,
        source_url.to_s.strip,
        JSON.generate(preferences)
      ].join("\n"))
    end
  end
end
