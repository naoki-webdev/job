require "net/http"
require "json"

module JobDrafts
  class AiExtractor
    MODEL = "gemini-2.5-flash".freeze
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models".freeze
    OPEN_TIMEOUT_SECONDS = 5
    TIMEOUT_SECONDS = 30
    MAX_OUTPUT_TOKENS = 1024

    def self.available?
      api_key.present?
    end

    def self.api_key
      ENV["GEMINI_API_KEY"].presence
    end

    def initialize(text:, url:, masters:)
      @text = text.to_s
      @url = url.to_s
      @masters = masters
    end

    def call
      return nil unless self.class.available?

      body = http_request
      payload = JSON.parse(extracted_text(body).to_s)
      payload.is_a?(Hash) ? payload : nil
    rescue StandardError => error
      Rails.logger.warn(
        {
          event: "external_api_error",
          service: "gemini",
          request_id: Current.request_id,
          user_id: Current.user_id,
          error_class: error.class.name
        }.to_json
      )
      nil
    end

    private

    def http_request
      uri = endpoint_uri
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = OPEN_TIMEOUT_SECONDS
      http.read_timeout = TIMEOUT_SECONDS

      request = Net::HTTP::Post.new(uri.request_uri)
      request["content-type"] = "application/json"
      request["x-goog-api-key"] = self.class.api_key
      request.body = payload.to_json

      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      response = nil
      begin
        response = http.request(request)
      ensure
        Rails.logger.info(
          {
            event: "external_api_request",
            service: "gemini",
            model: MODEL,
            status: response&.code,
            request_id: Current.request_id,
            user_id: Current.user_id,
            duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1_000).round(1)
          }.to_json
        )
      end
      raise "Gemini API request failed with status #{response.code}" unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    end

    def endpoint_uri
      URI("#{BASE_URL}/#{MODEL}:generateContent")
    end

    def extracted_text(body)
      body.dig("candidates", 0, "content", "parts", 0, "text")
    end

    def payload
      {
        system_instruction: { parts: [ { text: system_prompt } ] },
        contents: [ { role: "user", parts: [ { text: user_prompt } ] } ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.2
        }
      }
    end

    def system_prompt
      <<~PROMPT.strip
        あなたはソフトウェアエンジニアの転職活動を支援するアシスタントです。
        与えられた求人票本文を分析し、必ず以下の JSON のみを返してください。マークダウンや前置きは禁止。

        {
          "company_name": "文字列または null",
          "salary_min_jpy": 整数または null,
          "salary_max_jpy": 整数または null,
          "work_style": "full_remote" | "hybrid" | "onsite" | null,
          "tech_stacks": ["..."],
          "location": "文字列または null",
          "pros": ["..."],
          "cons": ["..."],
          "questions": ["..."]
        }

        - 数値は数値型で。年収は「万円」「円」表記から日本円ベースの整数に変換する（例: 700万 → 7000000）。
        - work_style は記述から推定し、明記がなければ null。
        - tech_stacks は次のマスタを参考にし、近い名前があれば寄せる: #{master_names(:tech_stacks)}
        - location は次のマスタから1つ選ぶ: #{master_names(:locations)}。マッチしなければ null。
        - pros はユーザー登録済みの加点キーワードに本文が一致した場合のみ、その label を返す: #{evaluation_rule_lines(:positive_keywords)}
        - cons はユーザー登録済みの減点キーワードに本文が一致した場合のみ、その label を返す: #{evaluation_rule_lines(:negative_keywords)}
        - questions はユーザー登録済みの確認項目のみを返す: #{question_lines}
        - 登録済みマスタが空、または本文に一致しない場合、pros / cons / questions は空配列にする。
      PROMPT
    end

    def user_prompt
      [
        "URL: #{@url.presence || '(なし)'}",
        "求人票本文:",
        @text
      ].join("\n\n")
    end

    def master_names(key)
      @masters[key].map(&:name).join(", ")
    end

    def evaluation_rule_lines(key)
      rules = Array(@masters[key])
      return "(未登録)" if rules.empty?

      rules.map { |rule| "#{rule.pattern} => #{rule.label}" }.join(", ")
    end

    def question_lines
      questions = Array(@masters[:interview_questions])
      return "(未登録)" if questions.empty?

      questions.map(&:body).join(", ")
    end
  end
end
