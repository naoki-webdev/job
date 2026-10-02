module JobDrafts
  class RuleBasedParser
    COMPANY_LABEL_PATTERN = /\A[>#*\s]*(?:会社名|企業名|募集企業)\s*[:：]\s*([^\n]+)/
    COMPANY_NAME_PATTERN = /\A(?:
      (?:株式会社|有限会社|合同会社|合資会社|合名会社)[\p{Han}\p{Hiragana}\p{Katakana}A-Za-z0-9・＆&._ -]{1,32}
      |
      [\p{Han}\p{Hiragana}\p{Katakana}A-Za-z0-9・＆&._ -]{1,32}?(?:株式会社|有限会社|合同会社|合資会社|合名会社)
    )\z/x
    COMPANY_SECTION_PATTERN = /\A(?:\#{1,6}\s*)?(?:仕事内容|事業内容|業務内容|募集背景|応募要件|応募条件|応募資格|募集している求人|待遇|福利厚生|休日・休暇|選考プロセス)/
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
      labeled_name = opening_lines.filter_map do |line|
        match = line.match(COMPANY_LABEL_PATTERN)
        next unless match

        company_name_candidate(match[1]) || match[1].split(/\s+[-–—|｜]\s+|\||・/).first&.strip&.slice(0, 64).presence
      end.first
      return labeled_name if labeled_name

      opening_lines.each do |line|
        candidate = company_name_candidate(line)
        return candidate if candidate
      end

      nil
    end

    def company_name_candidate(line)
      line.to_s.split(/\s+[-–—|｜]\s+|[：:]|\|/).each do |segment|
        normalized = segment.gsub(/\A[>#*\s]+|[>#*\s]+\z/, "").strip
        next if normalized.blank?

        match = normalized.match(COMPANY_NAME_PATTERN)
        return match[0].strip if match
      end

      nil
    end

    def salary_pair
      salary_text = @text.match(/(?:想定)?年収\s*[:：]?\s*([^\n。;；]*)/i)&.captures&.first
      labeled_pair = parse_salary_pair(salary_text) if salary_text.present?
      return labeled_pair if labeled_pair

      header_salary_lines = opening_lines.select do |line|
        line.match?(/\d{3,5}\s*万(?:円)?\s*[〜～~\-−–]\s*\d{3,5}\s*万(?:円)?/) ||
          line.match?(/\A\s*[¥￥]?\s*\d{3,5}\s*万(?:円)?\s*\z/)
      end
      parse_salary_pair(header_salary_lines.join(" "))
    end

    def parse_salary_pair(salary_text)
      return nil if salary_text.blank?
      return nil if salary_text.match?(/\d{3,5}\s*万(?:円)?\s*(?:UP|アップ|増額)/i)

      salary_text = salary_text.split(/、|入社祝い金|祝い金|賞与|諸手当|手当|インセンティブ/, 2).first
      manyen_range_matches = salary_text.scan(/(\d{3,5})\s*[〜～~\-−–]\s*(\d{3,5})\s*万(?:円)?/)
      manyen_matches = if manyen_range_matches.any?
        manyen_range_matches.flat_map { |minimum, maximum| [ minimum.to_i, maximum.to_i ] }
      else
        salary_text.scan(/(\d{3,5})\s*万(?:円)?/).map { |m| m.first.to_i }
      end
      jpy_matches = salary_text.scan(/(\d{1,3}(?:,\d{3})+)\s*円/).map { |m| m.first.delete(",").to_i / 10_000 }
      candidates = (manyen_matches + jpy_matches).uniq.select { |v| v.between?(300, 5_000) }
      return nil if candidates.empty?

      sorted = candidates.sort
      [ sorted.first * 10_000, sorted.last * 10_000 ]
    end

    def opening_lines
      @opening_lines ||= @text.each_line.map(&:strip).reject(&:blank?)
        .take_while { |line| !line.match?(COMPANY_SECTION_PATTERN) }
        .first(80)
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
