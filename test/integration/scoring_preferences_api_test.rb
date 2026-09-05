require "test_helper"

class ScoringPreferencesApiTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

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
    clear_enqueued_jobs
    clear_performed_jobs

    @user = create_user(email: "scoring-api@example.com")
    @other_user = create_user(email: "other-scoring-api@example.com")
    @headers = auth_headers(@user)
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    typescript = TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)

    @job = Job.new(
      user: @user,
      company_name: "サンプル会社 A",
      position: position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 4_500_000,
      salary_max: 8_500_000,
      location: location,
      notes: ""
    )
    @job.tech_stacks = [ rails, typescript ]
    @job.save!
  end

  test "show returns current scoring preference" do
    get "/api/scoring_preference", headers: @headers

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal 30, body["full_remote_weight"]
    assert_equal 0, body["onsite_weight"]
    assert_equal 10, body["high_salary_bonus"]
  end

  test "update recalculates existing job scores" do
    assert_no_enqueued_jobs do
      patch "/api/scoring_preference",
        params: {
          scoring_preference: {
            full_remote_weight: 50,
            high_salary_bonus: 20
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :success
    assert_equal 119, @job.reload.score
    assert_equal "scoring_preference.update", ActivityLog.last.action
    assert_equal @user.id, ActivityLog.last.user_id
  end

  test "update only recalculates the current user's jobs" do
    other_location = Location.create!(user: @other_user, name: "他ユーザーの勤務地", score_weight: 6, active: true, display_order: 0)
    other_position = Position.create!(user: @other_user, name: "他ユーザーの職種", score_weight: 8, active: true, display_order: 0)
    other_rails = TechStack.create!(user: @other_user, name: "他ユーザーのRails", score_weight: 20, active: true, display_order: 0)
    other_typescript = TechStack.create!(user: @other_user, name: "他ユーザーのTypeScript", score_weight: 15, active: true, display_order: 1)

    other_job = Job.new(
      user: @other_user,
      company_name: "別ユーザー会社",
      position: other_position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 4_500_000,
      salary_max: 8_500_000,
      location: other_location,
      notes: ""
    )
    other_job.tech_stacks = [ other_rails, other_typescript ]
    other_job.save!
    original_score = other_job.score

    assert_no_enqueued_jobs do
      patch "/api/scoring_preference",
        params: {
          scoring_preference: {
            full_remote_weight: 50
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :success
    assert_equal original_score, other_job.reload.score
  end
end
