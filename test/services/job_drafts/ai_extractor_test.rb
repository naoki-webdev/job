require "test_helper"
require "net/http"

module JobDrafts
  class AiExtractorTest < ActiveSupport::TestCase
    test "sends the Gemini key in a header instead of the URL" do
      response = Net::HTTPSuccess.new("1.1", "200", "OK")
      response.body = {
        candidates: [
          { content: { parts: [ { text: '{"company_name":"サンプル会社"}' } ] } }
        ]
      }.to_json
      http = FakeHttp.new(response)

      ENV["GEMINI_API_KEY"] = "secret-key"
      original_new = Net::HTTP.method(:new)
      Net::HTTP.define_singleton_method(:new) { |*_args| http }
      begin
        result = AiExtractor.new(text: "求人本文", url: "", masters: empty_masters).send(:http_request)

        extracted_text = result.dig("candidates", 0, "content", "parts", 0, "text")
        assert_equal "サンプル会社", JSON.parse(extracted_text)["company_name"]
      ensure
        Net::HTTP.define_singleton_method(:new, original_new)
      end

      assert_equal "secret-key", http.last_request["x-goog-api-key"]
      assert_equal "/v1beta/models/gemini-2.5-flash:generateContent", http.last_request.path
      assert_not_includes http.last_request.path, "key="
      assert_not_includes http.last_request.body, "score_estimate"
    ensure
      ENV.delete("GEMINI_API_KEY")
    end

    private

    def empty_masters
      {
        tech_stacks: [],
        locations: [],
        positive_keywords: [],
        negative_keywords: [],
        interview_questions: []
      }
    end

    class FakeHttp
      attr_reader :last_request

      def initialize(response)
        @response = response
        @response.instance_variable_set(:@read, true)
      end

      def use_ssl=(_value); end
      def open_timeout=(_value); end
      def read_timeout=(_value); end

      def request(request)
        @last_request = request
        @response
      end
    end
  end
end
