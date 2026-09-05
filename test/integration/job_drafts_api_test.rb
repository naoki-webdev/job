require "test_helper"
require "net/http"

class JobDraftsApiTest < ActionDispatch::IntegrationTest
  setup do
    JobTechStack.delete_all
    Job.delete_all
    Location.delete_all
    Position.delete_all
    TechStack.delete_all
    ScoringPreference.delete_all
    PositiveKeyword.delete_all
    NegativeKeyword.delete_all
    InterviewQuestion.delete_all
    ActivityLog.delete_all
    Location.delete_all
    Position.delete_all
    TechStack.delete_all
    User.delete_all

    @user = create_user(email: "drafts@example.com")
    @headers = auth_headers(@user)

    Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    Location.create!(user: @user, name: "リモート", score_weight: 12, active: true, display_order: 1)
    TechStack.create!(user: @user, name: "React", score_weight: 8, active: true, display_order: 0)
    TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)
    @user.positive_keywords.create!(pattern: "React", label: "React を使う開発", active: true, display_order: 0)
    @user.negative_keywords.create!(pattern: "業務範囲", label: "業務範囲を確認", active: true, display_order: 0)
    @user.interview_questions.create!(body: "チーム体制と役割分担", active: true, display_order: 0)
  end

  test "create returns rule-based draft and insights" do
    post "/api/job_drafts",
      params: {
        job_draft: {
          mode: "rule",
          url: "https://example.com/job/1",
          text: "株式会社サンプル\n年収700万〜900万\n勤務地: 東京（フルリモート可）\n必須スキル: React / TypeScript\n業務範囲の確認が必要"
        }
      },
      headers: @headers,
      as: :json

    assert_response :success

    body = JSON.parse(response.body)
    draft = body["draft"]
    insights = body["insights"]

    assert_equal "rule", body["mode"]
    assert_equal "full_remote", draft["work_style"]
    assert_equal 7_000_000, draft["salary_min"]
    assert_equal 9_000_000, draft["salary_max"]
    assert_equal "https://example.com/job/1", draft["source_url"]
    assert_includes draft["tech_stack_names"], "React"
    assert_includes draft["tech_stack_names"], "TypeScript"
    assert_equal "東京", draft["location_name"]
    assert insights["score_estimate"].is_a?(Integer)
    assert_includes insights["pros"], "React を使う開発"
    assert_includes insights["cons"], "業務範囲を確認"
    assert_equal [ "チーム体制と役割分担" ], insights["questions"]
  end

  test "create returns empty insights when the current user has no evaluation masters" do
    @user.positive_keywords.delete_all
    @user.negative_keywords.delete_all
    @user.interview_questions.delete_all

    post "/api/job_drafts",
      params: {
        job_draft: {
          mode: "rule",
          url: "",
          text: "株式会社サンプル\nReact 業務範囲 フルリモート"
        }
      },
      headers: @headers,
      as: :json

    assert_response :success

    insights = JSON.parse(response.body)["insights"]
    assert_nil insights["score_estimate"]
    assert_empty insights["pros"]
    assert_empty insights["cons"]
    assert_empty insights["questions"]
  end

  test "create does not use another user's evaluation masters" do
    other_user = create_user(email: "other-drafts@example.com")
    other_user.positive_keywords.create!(pattern: "React", label: "別ユーザーのReact評価", active: true, display_order: 0)
    other_user.negative_keywords.create!(pattern: "業務範囲", label: "別ユーザーの業務範囲評価", active: true, display_order: 0)
    @user.positive_keywords.delete_all
    @user.negative_keywords.delete_all
    @user.interview_questions.delete_all

    post "/api/job_drafts",
      params: { job_draft: { mode: "rule", url: "", text: "React 業務範囲" } },
      headers: @headers,
      as: :json

    assert_response :success
    insights = JSON.parse(response.body)["insights"]
    assert_empty insights["pros"]
    assert_empty insights["cons"]
  end

  test "ai-enabled user falls back to rule when GEMINI_API_KEY is missing" do
    @user.update!(ai_enabled: true)
    ENV.delete("GEMINI_API_KEY")

    post "/api/job_drafts",
      params: { job_draft: { mode: "ai", url: "", text: "年収500万 勤務地リモート" } },
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "rule", body["mode"]
    assert_equal false, body["ai_available"]
  end

  test "ai mode returns a normalized draft and server-derived insights" do
    @user.update!(ai_enabled: true)
    ENV["GEMINI_API_KEY"] = "test-key"

    gemini_response = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: {
                  company_name: "AI株式会社",
                  salary_min_jpy: 6_000_000,
                  salary_max_jpy: 9_000_000,
                  work_style: "full_remote",
                  tech_stacks: [ "TypeScript", "登録外の技術" ],
                  location: "東京",
                  score_estimate: 99,
                  pros: [ "React を使う開発", "登録外の加点理由" ],
                  cons: [ "業務範囲を確認" ],
                  questions: [ "チーム体制と役割分担", "登録外の質問" ]
                }.to_json
              }
            ]
          }
        }
      ]
    }

    with_fake_gemini_response(gemini_response) do
      post "/api/job_drafts",
        params: { job_draft: { mode: "ai", url: "https://example.com/ai-job", text: "求人本文" } },
        headers: auth_headers(@user),
        as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal "ai", body["mode"]
    assert_equal "AI株式会社", body.dig("draft", "company_name")
    assert_equal 6_000_000, body.dig("draft", "salary_min")
    assert_equal [ "TypeScript" ], body.dig("draft", "tech_stack_names")
    assert_equal "東京", body.dig("draft", "location_name")
    assert_equal 49, body.dig("insights", "score_estimate")
    assert_equal [ "React を使う開発" ], body.dig("insights", "pros")
    assert_equal [ "業務範囲を確認" ], body.dig("insights", "cons")
    assert_equal [ "チーム体制と役割分担" ], body.dig("insights", "questions")
  ensure
    ENV.delete("GEMINI_API_KEY")
  end

  test "read-only demo user cannot use the endpoint" do
    @user.update!(read_only: true)

    post "/api/job_drafts",
      params: { job_draft: { mode: "rule", url: "", text: "本文" } },
      headers: auth_headers(@user),
      as: :json

    assert_response :forbidden
  end

  test "non-master user requesting ai mode is forced to rule mode" do
    # default user has ai_enabled=false
    ENV["GEMINI_API_KEY"] = "test-key-should-not-be-used"

    post "/api/job_drafts",
      params: { job_draft: { mode: "ai", url: "", text: "年収500万 勤務地リモート" } },
      headers: @headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "rule", body["mode"]
  ensure
    ENV.delete("GEMINI_API_KEY")
  end

  test "read-only user requesting ai mode is rejected before extraction" do
    @user.update!(read_only: true)
    ENV["GEMINI_API_KEY"] = "test-key-should-not-be-used"

    post "/api/job_drafts",
      params: { job_draft: { mode: "ai", url: "", text: "本文" } },
      headers: auth_headers(@user),
      as: :json

    assert_response :forbidden
  ensure
    ENV.delete("GEMINI_API_KEY")
  end

  test "rejects text that exceeds the maximum length" do
    post "/api/job_drafts",
      params: { job_draft: { mode: "rule", url: "", text: "a" * 8_001 } },
      headers: @headers,
      as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_match(/8000/, body["errors"].first)
    assert_equal "JOB_DRAFT_TEXT_TOO_LONG", body["code"]
    assert body["request_id"].present?
  end

  test "rejects empty text" do
    post "/api/job_drafts",
      params: { job_draft: { mode: "rule", url: "", text: "   " } },
      headers: @headers,
      as: :json

    assert_response :unprocessable_entity
  end

  test "unauthenticated request is rejected" do
    post "/api/job_drafts",
      params: { job_draft: { mode: "rule", url: "", text: "本文" } },
      as: :json

    assert_response :unauthorized
  end

  private

  def with_fake_gemini_response(payload)
    response = Net::HTTPSuccess.new("1.1", "200", "OK")
    response.body = payload.to_json
    response.instance_variable_set(:@read, true)
    http = FakeGeminiHttp.new(response)
    original_new = Net::HTTP.method(:new)
    Net::HTTP.define_singleton_method(:new) { |*_args| http }

    yield
  ensure
    Net::HTTP.define_singleton_method(:new, original_new) if original_new
  end

  class FakeGeminiHttp
    def initialize(response)
      @response = response
    end

    def use_ssl=(_value); end
    def open_timeout=(_value); end
    def read_timeout=(_value); end

    def request(_request)
      @response
    end
  end
end
