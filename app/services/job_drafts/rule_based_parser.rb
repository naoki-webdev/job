module JobDrafts
  class RuleBasedParser
    FULL_REMOTE_PATTERNS = [
      /フルリモート/i,
      /完全リモート/i,
      /完全在宅/i,
      /全国.*リモート/i,
      /リモート.*全国/i
    ].freeze
    HYBRID_PATTERNS = [
      /ハイブリッド/i,
      /一部リモート/i,
      /(?<!フル)(?<!完全)リモート可/i,
      /(?<!フル)(?<!完全)リモート勤務可/i,
      /(?<!完全)在宅勤務可/i,
      /リモート併用/i,
      /週\s*\d+\s*日?.*出社/i,
      /出社.*週\s*\d+\s*日?/i
    ].freeze
    ONSITE_PATTERNS = [
      /原則出社/i,
      /出社前提/i,
      /出社必須/i,
      /出社のみ/i,
      /フル出社/i,
      /出社勤務/i,
      /常駐/i,
      /客先常駐/i,
      /オンサイト/i
    ].freeze

    def initialize(text:, url:, masters:)
      @text = text.to_s
      @url = url.to_s
      @masters = masters
    end

    def call
      positive_labels = pros
      negative_labels = cons

      {
        "company_name" => extract_company_name,
        "salary_min_jpy" => salary_pair&.first,
        "salary_max_jpy" => salary_pair&.last,
        "work_style" => extract_work_style,
        "tech_stacks" => match_master_names(@masters[:tech_stacks]),
        "location" => match_master_names(@masters[:locations]).first,
        "score_estimate" => ScoreEstimator.call(pros: positive_labels, cons: negative_labels),
        "pros" => positive_labels,
        "cons" => negative_labels,
        "questions" => questions
      }
    end

    private

    def extract_company_name
      first_line = @text.each_line.map(&:strip).find { |line| line.length.positive? }
      return nil unless first_line

      first_line.slice(0, 64)
    end

    def salary_pair
      salary_text = @text.match(/(?:想定)?年収\s*[:：]?\s*([^\n。;；]*)/i)&.captures&.first
      return nil unless salary_text

      salary_text = salary_text.split(/、|入社祝い金|祝い金|賞与|諸手当|手当|インセンティブ/, 2).first
      manyen_matches = salary_text.scan(/(\d{3,5})\s*万(?:円)?/).map { |m| m.first.to_i }
      manyen_range_matches = salary_text.scan(/(\d{3,5})\s*[〜～~\-−–]\s*(\d{3,5})\s*万(?:円)?/).flat_map do |minimum, maximum|
        [ minimum.to_i, maximum.to_i ]
      end
      jpy_matches = salary_text.scan(/(\d{1,3}(?:,\d{3})+)\s*円/).map { |m| m.first.delete(",").to_i / 10_000 }
      candidates = (manyen_matches + manyen_range_matches + jpy_matches).uniq.select { |v| v.between?(300, 5_000) }
      return nil if candidates.empty?

      sorted = candidates.sort
      [ sorted.first * 10_000, sorted.last * 10_000 ]
    end

    def extract_work_style
      return "hybrid" if match_any?(HYBRID_PATTERNS)
      return "onsite" if match_any?(ONSITE_PATTERNS)
      return nil if @text.match?(/(?:フルリモート|完全リモート|完全在宅|リモート勤務?)\s*(?:は|が)?\s*(?:不可|できません|できない|ではありません|ではない|対象外|なし)/i)
      return "full_remote" if match_any?(FULL_REMOTE_PATTERNS)

      nil
    end

    def match_master_names(records)
      records.filter_map do |record|
        record.name if MasterMatcher.text_match?(record.name, @text)
      end
    end

    def pros
      matched_keyword_labels(@masters[:positive_keywords])
    end

    def cons
      matched_keyword_labels(@masters[:negative_keywords])
    end

    def questions
      Array(@masters[:interview_questions]).filter_map(&:body).uniq
    end

    def matched_keyword_labels(records)
      Array(records).filter_map do |record|
        next if record.pattern.blank?

        record.label if @text.downcase.include?(record.pattern.downcase)
      end.uniq
    end

    def match_any?(patterns)
      patterns.any? { |pattern| @text.match?(pattern) }
    end
  end
end
