require "digest"
require "json"

module JobAnalysis
  class InputDigest
    def self.call(source_text:, source_url: nil, preferences:)
      Digest::SHA256.hexdigest([ source_text.to_s.strip, source_url.to_s.strip, JSON.generate(preferences) ].join("\n"))
    end
  end
end
