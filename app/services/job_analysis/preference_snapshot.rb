module JobAnalysis
  class PreferenceSnapshot
    def initialize(user)
      @user = user
    end

    def call
      {
        "must" => [],
        "prefer" => [
          *named_values(@user.positions.active.ordered, "position"),
          *named_values(@user.locations.active.ordered, "location"),
          *named_values(@user.tech_stacks.active.ordered, "tech_stack"),
          *keyword_values(@user.positive_keywords.active.ordered, "prefer")
        ],
        "avoid" => keyword_values(@user.negative_keywords.active.ordered, "avoid"),
        "verify" => @user.interview_questions.active.ordered.map { |question| question.body.to_s.strip }.reject(&:blank?),
        "scoring" => scoring_snapshot
      }
    end

    private

    def named_values(records, type)
      records.map { |record| { "type" => type, "value" => record.name.to_s.strip } }
        .select { |item| item["value"].present? }
    end

    def keyword_values(records, type)
      records.map do |record|
        {
          "type" => type,
          "value" => record.label.to_s.strip,
          "pattern" => record.pattern.to_s.strip
        }
      end.select { |item| item["value"].present? || item["pattern"].present? }
    end

    def scoring_snapshot
      preference = @user.scoring_preference
      return {} unless preference

      {
        "full_remote_weight" => preference.full_remote_weight,
        "hybrid_weight" => preference.hybrid_weight,
        "onsite_weight" => preference.onsite_weight,
        "high_salary_max_threshold" => preference.high_salary_max_threshold,
        "high_salary_bonus" => preference.high_salary_bonus,
        "low_salary_min_threshold" => preference.low_salary_min_threshold,
        "low_salary_penalty" => preference.low_salary_penalty
      }
    end
  end
end
