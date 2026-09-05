require "test_helper"

class ReadOnlyUserTest < ActionDispatch::IntegrationTest
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

    @user = create_user(email: "read-only@example.com")
    @user.update!(read_only: true)
    @headers = auth_headers(@user)

    @location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    @position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @tech = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)

    @job = Job.new(
      user: @user,
      company_name: "サンプル会社 R",
      position: @position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @location,
      notes: "閲覧専用ユーザーの求人"
    )
    @job.tech_stacks = [ @tech ]
    @job.save!
  end

  test "read-only user can view the job list" do
    get "/api/jobs", headers: @headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [ @job.id ], body["jobs"].map { |job| job["id"] }
  end

  test "read-only user can export csv" do
    get "/api/jobs/export", headers: @headers

    assert_response :success
  end

  test "read-only user cannot create a job" do
    assert_no_difference("Job.count") do
      post "/api/jobs",
        params: {
          job: {
            company_name: "Blocked Co",
            position_id: @position.id,
            status: "applied",
            work_style: "hybrid",
            employment_type: "full_time",
            salary_min: 5_000_000,
            salary_max: 6_000_000,
            tech_stack_ids: [ @tech.id ],
            location_id: @location.id,
            notes: ""
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :forbidden
  end

  test "read-only user cannot update a job" do
    patch "/api/jobs/#{@job.id}",
      params: { job: { status: "applied" } },
      headers: @headers,
      as: :json

    assert_response :forbidden
    assert_equal "interested", @job.reload.status
  end

  test "read-only user cannot delete a job" do
    assert_no_difference("Job.count") do
      delete "/api/jobs/#{@job.id}", headers: @headers
    end

    assert_response :forbidden
  end

  test "read-only user cannot update scoring preference" do
    patch "/api/scoring_preference",
      params: { scoring_preference: { full_remote_weight: 99 } },
      headers: @headers,
      as: :json

    assert_response :forbidden
  end

  test "read-only user cannot create master data" do
    post "/api/positions",
      params: { position: { name: "Blocked Position", score_weight: 0, active: true, display_order: 99 } },
      headers: @headers,
      as: :json

    assert_response :forbidden
  end

  test "read-only user cannot change evaluation masters" do
    post "/api/positive_keywords",
      params: { positive_keyword: { pattern: "フルリモート", label: "リモート前提", active: true, display_order: 0 } },
      headers: @headers,
      as: :json

    assert_response :forbidden
    assert_equal 0, @user.positive_keywords.count
  end
end
