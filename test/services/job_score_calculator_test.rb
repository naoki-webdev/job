require "test_helper"

class JobScoreCalculatorTest < ActiveSupport::TestCase
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

    @user = create_user(email: "score-calculator@example.com")
    @location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    @position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    @typescript = TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)

    ScoringPreference.create!(
      user: @user,
      full_remote_weight: 30,
      hybrid_weight: 15,
      onsite_weight: -5,
      high_salary_max_threshold: 8_000_000,
      high_salary_bonus: 10,
      low_salary_min_threshold: 4_000_000,
      low_salary_penalty: -10
    )
  end

  test "adds full remote weight, master weights, tech stack weights and high salary bonus" do
    job = build_job(work_style: "full_remote", salary_min: 4_500_000, salary_max: 8_500_000)

    assert_equal 89, JobScoreCalculator.call(job)
  end

  test "uses the hybrid work style weight" do
    job = build_job(work_style: "hybrid", salary_min: 5_000_000, salary_max: 7_000_000)

    assert_equal 64, JobScoreCalculator.call(job)
  end

  test "uses the onsite weight and low salary penalty" do
    job = build_job(work_style: "onsite", salary_min: 3_500_000, salary_max: 5_500_000)

    assert_equal 34, JobScoreCalculator.call(job)
  end

  test "does not create a scoring preference while calculating a score" do
    ScoringPreference.delete_all
    job = build_job(work_style: "full_remote", salary_min: 5_000_000, salary_max: 7_000_000)

    assert_no_difference("ScoringPreference.count") do
      assert_equal 79, JobScoreCalculator.call(job)
    end
  end

  test "uses a provided scoring preference" do
    job = build_job(work_style: "full_remote", salary_min: 5_000_000, salary_max: 7_000_000)
    preference = ScoringPreference.find_by!(user: @user).dup
    preference.full_remote_weight = 50

    assert_equal 99, JobScoreCalculator.call(job, preference: preference)
  end

  private

  def build_job(overrides = {})
    job = Job.new({
      user: @user,
      company_name: "サンプル会社",
      position: @position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @location,
      notes: ""
    }.merge(overrides))
    job.tech_stacks = [ @rails, @typescript ]
    job
  end
end
