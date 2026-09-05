module JobDrafts
  class Builder
    VALID_MODES = %w[rule ai].freeze
    WORK_STYLES = %w[full_remote hybrid onsite].freeze

    def initialize(user:, text:, url:, mode:)
      @user = user
      @text = text.to_s
      @url = url.to_s.strip
      @mode = VALID_MODES.include?(mode.to_s) ? mode.to_s : "rule"
    end

    def call
      raw, actual_mode = extract

      {
        mode: actual_mode,
        ai_available: AiExtractor.available?,
        draft: build_draft(raw),
        insights: build_insights(raw)
      }
    end

    private

    def extract
      if @mode == "ai" && AiExtractor.available?
        ai = AiExtractor.new(text: @text, url: @url, masters: masters).call
        return [ normalize_response(ai), "ai" ] if useful_ai_response?(ai)
      end

      [ RuleBasedParser.new(text: @text, url: @url, masters: masters).call, "rule" ]
    end

    def useful_ai_response?(response)
      normalized = normalize_response(response)
      return false unless normalized

      normalized.values_at("company_name", "salary_min_jpy", "salary_max_jpy", "work_style", "tech_stacks", "location").any? do |value|
        value.present?
      end
    end

    def normalize_response(response)
      return unless response.is_a?(Hash)

      normalized = {
        "company_name" => normalized_string(response["company_name"]),
        "salary_min_jpy" => normalized_integer(response["salary_min_jpy"]),
        "salary_max_jpy" => normalized_integer(response["salary_max_jpy"]),
        "work_style" => WORK_STYLES.include?(response["work_style"]) ? response["work_style"] : nil,
        "tech_stacks" => normalized_strings(response["tech_stacks"]),
        "location" => normalized_string(response["location"]),
        "pros" => response["pros"],
        "cons" => response["cons"],
        "questions" => response["questions"]
      }

      return unless normalized.values_at("company_name", "salary_min_jpy", "salary_max_jpy", "work_style", "tech_stacks", "location").any?(&:present?)

      normalized
    end

    def masters
      @masters ||= {
        tech_stacks: @user.tech_stacks.active.ordered.to_a,
        locations: @user.locations.active.ordered.to_a,
        positive_keywords: @user.positive_keywords.active.ordered.to_a,
        negative_keywords: @user.negative_keywords.active.ordered.to_a,
        interview_questions: @user.interview_questions.active.ordered.to_a
      }
    end

    def build_draft(raw)
      raw = normalize_response(raw) || {}
      tech_records = matched_tech_stacks(raw["tech_stacks"])
      location_record = matched_location(raw["location"])

      {
        company_name: raw["company_name"],
        source_url: @url.presence,
        salary_min: raw["salary_min_jpy"],
        salary_max: raw["salary_max_jpy"],
        work_style: WORK_STYLES.include?(raw["work_style"]) ? raw["work_style"] : nil,
        tech_stack_ids: tech_records.map(&:id),
        tech_stack_names: tech_records.map(&:name),
        location_id: location_record&.id,
        location_name: location_record&.name
      }
    end

    def build_insights(raw)
      raw = normalize_response(raw) || raw
      pros = whitelist_values(raw["pros"], masters[:positive_keywords].map(&:label))
      cons = whitelist_values(raw["cons"], masters[:negative_keywords].map(&:label))
      questions = whitelist_values(raw["questions"], masters[:interview_questions].map(&:body))

      {
        score_estimate: ScoreEstimator.call(pros: pros, cons: cons),
        pros: pros,
        cons: cons,
        questions: questions
      }
    end

    def whitelist_values(values, allowed_values)
      Array(values).filter_map do |value|
        next unless value.is_a?(String)

        normalized = value.strip
        normalized if normalized.present? && allowed_values.include?(normalized)
      end.uniq
    end

    def matched_tech_stacks(names)
      Array(names).flat_map do |name|
        next [] if name.blank?

        masters[:tech_stacks].select { |record| match?(record.name, name) }
      end.uniq
    end

    def matched_location(name)
      return nil if name.blank?

      masters[:locations].find { |record| match?(record.name, name) }
    end

    def match?(master_name, candidate)
      MasterMatcher.candidate_match?(master_name, candidate)
    end

    def integer_or_nil(value)
      Integer(value)
    rescue ArgumentError, TypeError
      nil
    end

    def normalized_integer(value)
      integer = case value
      when Integer
        value
      when String
        integer_or_nil(value)
      end
      integer if integer && integer >= 0
    end

    def normalized_string(value)
      value.strip.presence if value.is_a?(String)
    end

    def normalized_strings(values)
      Array(values).filter_map { |value| normalized_string(value) }.uniq
    end
  end
end
