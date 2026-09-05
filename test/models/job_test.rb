require "test_helper"

class JobTest < ActiveSupport::TestCase
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

    @user = create_user(email: "job-model@example.com")
    @location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    @position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    @typescript = TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)

    ScoringPreference.create!(
      user: @user,
      full_remote_weight: 30,
      hybrid_weight: 15,
      onsite_weight: 0,
      high_salary_max_threshold: 8_000_000,
      high_salary_bonus: 10,
      low_salary_min_threshold: 4_000_000,
      low_salary_penalty: -10
    )
  end

  test "calculates score from work style master data tech stacks and salary bonus" do
    job = build_job(
      work_style: "full_remote",
      salary_min: 4_500_000,
      salary_max: 8_500_000
    )

    assert job.valid?
    assert_equal 89, job.score
  end

  test "applies low salary penalty when salary_min is below threshold" do
    job = build_job(
      work_style: "onsite",
      salary_min: 3_500_000,
      salary_max: 5_500_000
    )

    assert job.valid?
    assert_equal 39, job.score
  end

  test "validates required fields and salary range" do
    job = Job.new(
      company_name: "",
      user: @user,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 6_000_000,
      salary_max: 5_000_000,
      notes: ""
    )

    assert_not job.valid?
    assert_includes job.errors[:company_name], "can't be blank"
    assert_includes job.errors[:position], "can't be blank"
    assert_includes job.errors[:tech_stacks], "can't be blank"
    assert_includes job.errors[:location], "can't be blank"
    assert_includes job.errors[:salary_max], "must be greater than or equal to 6000000"
  end

  test "joins tech stack names for display" do
    job = build_job

    assert_equal "Ruby on Rails, TypeScript", job.tech_stack_names
  end

  test "rejects master data owned by another user" do
    other_user = create_user(email: "other-job-model@example.com")
    other_location = Location.create!(user: other_user, name: "大阪", score_weight: 4, active: true, display_order: 0)

    job = Job.new(
      user: @user,
      company_name: "別ユーザーの勤務地",
      position: @position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: other_location
    )
    job.tech_stacks = [ @rails ]

    assert_not job.valid?
    assert_includes job.errors[:location], "must belong to the same user"
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
    job.save!
    job
  end
end
