require "test_helper"

class SessionsApiTest < ActionDispatch::IntegrationTest
  setup do
    JobTechStack.delete_all
    Job.delete_all
    ScoringPreference.delete_all
    PositiveKeyword.delete_all
    NegativeKeyword.delete_all
    InterviewQuestion.delete_all
    ActivityLog.delete_all
    Location.delete_all
    Position.delete_all
    TechStack.delete_all
    User.delete_all

    @user = create_user(email: demo_email, password: "password")
  end

  test "create sets an http-only session cookie for valid credentials" do
    post "/api/session",
      params: { session: { email: demo_email, password: "password" } },
      as: :json

    assert_response :created
    body = JSON.parse(response.body)

    assert_equal @user.id, body["user"]["id"]
    assert_equal demo_email, body["user"]["email"]
    assert_equal false, body["user"]["read_only"]
    assert_equal false, body["user"]["ai_enabled"]
    assert_nil body["token"]
    assert cookies[UserSession::COOKIE_NAME].present?
    assert_includes response.headers["Set-Cookie"].downcase, "httponly"
  end

  test "create returns ai_enabled flag for master users" do
    @user.update!(ai_enabled: true)

    post "/api/session",
      params: { session: { email: demo_email, password: "password" } },
      as: :json

    assert_response :created
    body = JSON.parse(response.body)

    assert_equal true, body["user"]["ai_enabled"]
  end

  test "create returns read_only flag for read-only users" do
    @user.update!(read_only: true)

    post "/api/session",
      params: { session: { email: demo_email, password: "password" } },
      as: :json

    assert_response :created
    body = JSON.parse(response.body)

    assert_equal true, body["user"]["read_only"]
  end

  test "show returns read_only flag" do
    @user.update!(read_only: true)

    get "/api/session", headers: auth_headers(@user)

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal true, body["user"]["read_only"]
  end

  test "read-only users can sign out" do
    @user.update!(read_only: true)

    headers = auth_headers(@user)
    delete "/api/session", headers: headers

    assert_response :no_content

    get "/api/session", headers: headers

    assert_response :unauthorized
  end

  test "create rejects invalid credentials" do
    post "/api/session",
      params: { session: { email: demo_email, password: "wrong" } },
      as: :json

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "INVALID_LOGIN", body["code"]
    assert body["request_id"].present?
  end

  test "show returns the current user" do
    get "/api/session", headers: auth_headers(@user)

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal @user.id, body["user"]["id"]
    assert_nil body["token"]
  end

  test "prunes expired sessions when issuing a new session" do
    expired = UserSession.create!(
      user: @user,
      token_digest: UserSession.digest("expired-token"),
      expires_at: 1.minute.ago
    )

    UserSession.issue(@user)

    assert_not UserSession.exists?(expired.id)
  end

  test "api requests require authentication" do
    get "/api/jobs"

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "UNAUTHORIZED", body["code"]
    assert body["request_id"].present?
  end

  test "rejects state-changing requests from an untrusted origin" do
    post "/api/session",
      params: { session: { email: demo_email, password: "password" } },
      headers: { "Origin" => "https://attacker.example" },
      as: :json

    assert_response :forbidden
    assert_includes JSON.parse(response.body)["errors"].first, "安全確認"
  end

  test "allows state-changing requests from the configured frontend origin" do
    post "/api/session",
      params: { session: { email: demo_email, password: "password" } },
      headers: { "Origin" => "http://localhost:5173" },
      as: :json

    assert_response :created
  end

  private

  def demo_email
    Rails.application.config.x.demo_account.email
  end
end
