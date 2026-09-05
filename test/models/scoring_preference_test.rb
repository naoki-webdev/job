require "test_helper"

class ScoringPreferenceTest < ActiveSupport::TestCase
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
    User.delete_all
    clear_enqueued_jobs
    clear_performed_jobs

    @user = create_user(email: "scoring-model@example.com")
  end

  test "current creates a default preference when none exists" do
    preference = ScoringPreference.current(user: @user)

    assert preference.persisted?
    assert_equal 30, preference.full_remote_weight
    assert_equal 1, ScoringPreference.count
  end

  test "validates non negative thresholds" do
    preference = ScoringPreference.new(
      user: @user,
      high_salary_max_threshold: -1,
      low_salary_min_threshold: -1
    )

    assert_not preference.valid?
    assert_includes preference.errors[:high_salary_max_threshold], "must be greater than or equal to 0"
    assert_includes preference.errors[:low_salary_min_threshold], "must be greater than or equal to 0"
  end

  test "rejects overlapping salary thresholds" do
    preference = ScoringPreference.new(
      user: @user,
      high_salary_max_threshold: 4_000_000,
      low_salary_min_threshold: 8_000_000
    )

    assert_not preference.valid?
    assert_includes preference.errors[:high_salary_max_threshold], "must be greater than or equal to the low salary threshold"
  end

  test "recalculates existing job scores after update" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Rails", score_weight: 20, active: true, display_order: 0)
    preference = ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ rails ]
    job.save!

    assert_no_enqueued_jobs do
      preference.update!(full_remote_weight: 50)
    end

    assert_equal 84, job.reload.score
  end

  test "rolls back the preference update when score recalculation fails" do
    preference = ScoringPreference.create!(user: @user)
    original_call = RecalculateJobScores.method(:call)
    RecalculateJobScores.define_singleton_method(:call) { |**| raise "recalculation failed" }

    begin
      assert_raises(RuntimeError) do
        preference.update!(full_remote_weight: 50)
      end
    ensure
      RecalculateJobScores.define_singleton_method(:call, original_call)
    end

    assert_equal 30, preference.reload.full_remote_weight
  end
end
