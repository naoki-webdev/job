module JobDrafts
  module MasterMatcher
    EXPLICIT_ALIASES = {
      "Ruby on Rails" => [ "Rails" ],
      "TypeScript" => [ "TS" ],
      "JavaScript" => [ "JS" ],
      "PostgreSQL" => [ "Postgres" ]
    }.freeze

    module_function

    def text_match?(master_name, text)
      candidates(master_name).any? { |candidate| token_match?(text, candidate) }
    end

    def candidate_match?(master_name, candidate)
      normalized_candidate = normalize(candidate)
      return false if normalized_candidate.empty?

      candidates(master_name).any? { |name| normalize(name) == normalized_candidate }
    end

    def candidates(master_name)
      canonical_name = master_name.to_s.strip
      aliases = EXPLICIT_ALIASES.find { |name, _values| name.casecmp?(canonical_name) }&.last || []
      [ canonical_name, *aliases ]
    end

    def token_match?(text, candidate)
      normalized_candidate = candidate.to_s.strip
      return false if normalized_candidate.empty?

      if normalized_candidate.match?(/\A[[:ascii:]]+\z/)
        pattern = /(?<![A-Za-z0-9])#{Regexp.escape(normalized_candidate)}(?![A-Za-z0-9])/i
        text.to_s.match?(pattern)
      else
        text.to_s.downcase.include?(normalized_candidate.downcase)
      end
    end

    def normalize(value)
      value.to_s.strip.downcase.gsub(/\s+/, " ")
    end
  end
end
