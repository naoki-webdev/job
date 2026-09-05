require "test_helper"

class PositionsApiTest < ActionDispatch::IntegrationTest
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

    @user = create_user(email: "positions-api@example.com")
    @other_user = create_user(email: "other-positions-api@example.com")
    @headers = auth_headers(@user)
    @position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 1)
    @other_position = Position.create!(user: @user, name: "テックリード", score_weight: 15, active: true, display_order: 0)
    @foreign_position = Position.create!(user: @other_user, name: "他ユーザーの職種", score_weight: 99, active: true, display_order: 0)
  end

  test "index returns positions ordered by display_order" do
    get "/api/positions", headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal [ @other_position.id, @position.id ], body.map { |item| item["id"] }
    assert_not_includes body.map { |item| item["id"] }, @foreign_position.id
  end

  test "cannot update or destroy another user's position" do
    patch "/api/positions/#{@foreign_position.id}",
      params: { position: { name: "不正な更新" } },
      headers: @headers,
      as: :json

    assert_response :not_found

    assert_no_difference("Position.count") do
      delete "/api/positions/#{@foreign_position.id}", headers: @headers
    end

    assert_response :not_found
    assert_equal "他ユーザーの職種", @foreign_position.reload.name
  end

  test "create persists a new position" do
    assert_difference("Position.count", 1) do
      post "/api/positions",
        params: { position: { name: "フロントエンドエンジニア", score_weight: 5, active: true, display_order: 2 } },
        headers: @headers,
        as: :json
    end

    assert_response :created
    assert_equal "フロントエンドエンジニア", JSON.parse(response.body)["name"]
  end

  test "update changes an existing position" do
    patch "/api/positions/#{@position.id}",
      params: { position: { name: "バックエンドアーキテクト", score_weight: 10, active: false, display_order: 3 } },
      headers: @headers,
      as: :json

    assert_response :success

    body = JSON.parse(response.body)
    assert_equal "バックエンドアーキテクト", body["name"]
    assert_equal false, body["active"]
    assert_equal 10, @position.reload.score_weight
  end

  test "destroy removes an unused position" do
    assert_difference("Position.count", -1) do
      delete "/api/positions/#{@other_position.id}", headers: @headers
    end

    assert_response :no_content
  end

  test "destroy deactivates a position when jobs still reference it" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    tech_stack = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    job = Job.new(
      user: @user,
      company_name: "参照中の会社",
      position: @position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location
    )
    job.tech_stacks = [ tech_stack ]
    job.save!

    assert_no_difference("Position.count") do
      delete "/api/positions/#{@position.id}", headers: @headers
    end

    assert_response :success
    assert_equal false, @position.reload.active
    assert_equal false, JSON.parse(response.body)["active"]
  end
end
