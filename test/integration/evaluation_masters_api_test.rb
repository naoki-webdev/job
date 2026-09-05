require "test_helper"

class EvaluationMastersApiTest < ActionDispatch::IntegrationTest
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

    @user = create_user(email: "evaluation-masters@example.com")
    @other_user = create_user(email: "other-evaluation-masters@example.com")
    @headers = auth_headers(@user)
  end

  test "positive keyword CRUD is scoped to the current user" do
    other_keyword = @other_user.positive_keywords.create!(
      pattern: "React",
      label: "別ユーザーのReact評価",
      active: true,
      display_order: 0
    )

    post "/api/positive_keywords",
      params: { positive_keyword: { pattern: "フルリモート", label: "リモート前提", active: true, display_order: 1 } },
      headers: @headers,
      as: :json

    assert_response :created
    created = JSON.parse(response.body)
    assert_equal "フルリモート", created["pattern"]

    get "/api/positive_keywords", headers: @headers

    assert_response :success
    ids = JSON.parse(response.body).map { |item| item["id"] }
    assert_includes ids, created["id"]
    assert_not_includes ids, other_keyword.id

    patch "/api/positive_keywords/#{created['id']}",
      params: { positive_keyword: { label: "フルリモート勤務" } },
      headers: @headers,
      as: :json

    assert_response :success
    assert_equal "フルリモート勤務", @user.positive_keywords.find(created["id"]).label

    delete "/api/positive_keywords/#{created['id']}", headers: @headers

    assert_response :no_content
  end

  test "negative keyword CRUD is scoped to the current user" do
    other_keyword = @other_user.negative_keywords.create!(
      pattern: "業務範囲",
      label: "別ユーザーの業務範囲評価",
      active: true,
      display_order: 0
    )

    post "/api/negative_keywords",
      params: { negative_keyword: { pattern: "チーム体制", label: "チーム体制を確認", active: true, display_order: 1 } },
      headers: @headers,
      as: :json

    assert_response :created
    created = JSON.parse(response.body)

    get "/api/negative_keywords", headers: @headers

    assert_response :success
    ids = JSON.parse(response.body).map { |item| item["id"] }
    assert_includes ids, created["id"]
    assert_not_includes ids, other_keyword.id
  end

  test "interview question CRUD is scoped to the current user" do
    other_question = @other_user.interview_questions.create!(
      body: "別ユーザーの質問",
      active: true,
      display_order: 0
    )

    post "/api/interview_questions",
      params: { interview_question: { body: "チーム体制と役割分担", active: true, display_order: 1 } },
      headers: @headers,
      as: :json

    assert_response :created
    created = JSON.parse(response.body)

    get "/api/interview_questions", headers: @headers

    assert_response :success
    ids = JSON.parse(response.body).map { |item| item["id"] }
    assert_includes ids, created["id"]
    assert_not_includes ids, other_question.id
  end
end
