module JobAnalysis
  class ResultNormalizer
    MAX_ITEM_LENGTH = 1_000
    MAX_SUMMARY_LENGTH = 4_000
    MAX_ITEMS = 20
    VERDICTS = JobAiEvaluation::VERDICTS

    def initialize(raw:, preferences:, source_text: "")
      @raw = raw.is_a?(Hash) ? raw : {}
      @preferences = preferences
      @source_text = source_text.to_s
    end

    def call
      unknowns = strings(@raw["unknowns"])
      matches = findings(@raw["matches"])
      conflicts = findings(@raw["conflicts"])
      verdict = normalized_verdict(@raw["verdict"], matches: matches, conflicts: conflicts, unknowns: unknowns)

      {
        "verdict" => verdict,
        "summary" => bounded_string(@raw["summary"], fallback: "判定結果を確認してください。", limit: MAX_SUMMARY_LENGTH),
        "confidence" => normalized_confidence(@raw["confidence"]),
        "matches" => matches,
        "conflicts" => conflicts,
        "unknowns" => unknowns,
        "questions" => strings(@raw["questions"]),
        "preference_snapshot" => @preferences
      }
    end

    private

    def normalized_verdict(value, matches:, conflicts:, unknowns:)
      verdict = value.to_s
      return "insufficient_information" if conflicts.empty? && matches.empty? && unknowns.any?
      return verdict if VERDICTS.include?(verdict)

      conflicts.any? ? "conditional" : "insufficient_information"
    end

    def findings(values)
      Array(values).filter_map do |value|
        next unless value.is_a?(Hash)

        preference = bounded_string(value["preference"])
        reason = bounded_string(value["reason"])
        evidence = bounded_string(value["evidence"])
        evidence_verified = evidence.present? && @source_text.include?(evidence)
        next if preference.blank? || reason.blank?

        {
          "preference" => preference,
          "reason" => reason,
          "evidence" => (evidence if evidence_verified),
          "evidence_verified" => evidence_verified
        }
      end.first(MAX_ITEMS)
    end

    def strings(values)
      Array(values).filter_map { |value| bounded_string(value) }.first(MAX_ITEMS)
    end

    def bounded_string(value, fallback: nil, limit: MAX_ITEM_LENGTH)
      return fallback unless value.is_a?(String)

      value.strip.slice(0, limit).presence || fallback
    end

    def normalized_confidence(value)
      number = Float(value)
      return 0.0 if number.nan? || number.infinite?

      number.clamp(0.0, 1.0).round(3)
    rescue ArgumentError, TypeError
      0.0
    end
  end
end
