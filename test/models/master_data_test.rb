require "test_helper"

class PositionTest < ActiveSupport::TestCase
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

    @user = create_user(email: "position-model@example.com")
  end

  test "validates name uniqueness" do
    Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    position = Position.new(user: @user, name: "バックエンドエンジニア", score_weight: 5, active: true, display_order: 1)

    assert_not position.valid?
    assert_includes position.errors[:name], "has already been taken"
  end

  test "refreshes related job scores after update" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ rails ]
    job.save!

    assert_no_enqueued_jobs do
      position.update!(score_weight: 20)
    end

    assert_equal 61, job.reload.score
  end

  test "does not touch related jobs when only non-score fields change" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ rails ]
    job.save!

    previous_updated_at = 3.days.ago.change(usec: 0)
    job.update_column(:updated_at, previous_updated_at)

    position.update!(name: "バックエンドアーキテクト")

    assert_equal previous_updated_at.to_i, job.reload.updated_at.to_i
  end
end

class LocationTest < ActiveSupport::TestCase
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

    @user = create_user(email: "location-model@example.com")
  end

  test "ordered scope sorts by display_order then id" do
    second = Location.create!(user: @user, name: "大阪", score_weight: 4, active: true, display_order: 1)
    first = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)

    assert_equal [ first.id, second.id ], Location.ordered.pluck(:id)
  end

  test "does not refresh related jobs when only non-score fields change" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ rails ]
    job.save!

    previous_updated_at = 3.days.ago.change(usec: 0)
    job.update_column(:updated_at, previous_updated_at)

    location.update!(name: "東京本社")

    assert_equal previous_updated_at.to_i, job.reload.updated_at.to_i
  end
end

class TechStackTest < ActiveSupport::TestCase
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

    @user = create_user(email: "tech-stack-model@example.com")
  end

  test "active scope returns only active records" do
    active_stack = TechStack.create!(user: @user, name: "Rails", score_weight: 20, active: true, display_order: 0)
    TechStack.create!(user: @user, name: "Vue.js", score_weight: 5, active: false, display_order: 1)

    assert_equal [ active_stack.id ], TechStack.active.pluck(:id)
  end

  test "refreshes related job scores after update" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    tech_stack = TechStack.create!(user: @user, name: "Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ tech_stack ]
    job.save!

    assert_no_enqueued_jobs do
      tech_stack.update!(score_weight: 30)
    end

    assert_equal 59, job.reload.score
  end

  test "does not refresh related jobs when only non-score fields change" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    tech_stack = TechStack.create!(user: @user, name: "Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    job.tech_stacks = [ tech_stack ]
    job.save!

    previous_updated_at = 3.days.ago.change(usec: 0)
    job.update_column(:updated_at, previous_updated_at)

    tech_stack.update!(name: "Ruby on Rails")

    assert_equal previous_updated_at.to_i, job.reload.updated_at.to_i
  end
end

class JobTechStackTest < ActiveSupport::TestCase
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

    @user = create_user(email: "job-tech-stack-model@example.com")
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @tech_stack = TechStack.create!(user: @user, name: "Rails", score_weight: 20, active: true, display_order: 0)
    ScoringPreference.create!(user: @user)

    @job = Job.new(
      user: @user,
      company_name: "サンプル会社",
      position: position,
      status: "interested",
      work_style: "hybrid",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: location,
      notes: ""
    )
    @job.tech_stacks = [ @tech_stack ]
    @job.save!
  end

  test "validates uniqueness of tech stack per job" do
    duplicate = JobTechStack.new(job: @job, tech_stack: @tech_stack)

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:job_id], "has already been taken"
  end
end
