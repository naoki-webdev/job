require "test_helper"

class LocationsApiTest < ActionDispatch::IntegrationTest
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

    @user = create_user(email: "locations-api@example.com")
    @headers = auth_headers(@user)
    @location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 1)
    @other_location = Location.create!(user: @user, name: "リモート", score_weight: 12, active: true, display_order: 0)
  end

  test "index returns locations ordered by display_order" do
    get "/api/locations", headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal [ @other_location.id, @location.id ], body.map { |item| item["id"] }
  end

  test "create persists a new location" do
    assert_difference("Location.count", 1) do
      post "/api/locations",
        params: { location: { name: "大阪", score_weight: 4, active: true, display_order: 2 } },
        headers: @headers,
        as: :json
    end

    assert_response :created
    assert_equal "大阪", JSON.parse(response.body)["name"]
  end

  test "update changes an existing location" do
    patch "/api/locations/#{@location.id}",
      params: { location: { name: "東京23区", score_weight: 7, active: false, display_order: 3 } },
      headers: @headers,
      as: :json

    assert_response :success

    body = JSON.parse(response.body)
    assert_equal "東京23区", body["name"]
    assert_equal false, body["active"]
    assert_equal 7, @location.reload.score_weight
  end

  test "destroy removes an unused location" do
    assert_difference("Location.count", -1) do
      delete "/api/locations/#{@other_location.id}", headers: @headers
    end

    assert_response :no_content
  end

  test "destroy deactivates a location when jobs still reference it" do
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    tech_stack = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    job = Job.new(
      user: @user,
      company_name: "参照中の会社",
      position: position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @location
    )
    job.tech_stacks = [ tech_stack ]
    job.save!

    assert_no_difference("Location.count") do
      delete "/api/locations/#{@location.id}", headers: @headers
    end

    assert_response :success
    assert_equal false, @location.reload.active
    assert_equal false, JSON.parse(response.body)["active"]
  end
end
