require "test_helper"

class JobsQueryTest < ActiveSupport::TestCase
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

    @user = create_user(email: "jobs-query@example.com")
    ScoringPreference.create!(user: @user)
    @tokyo = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    @osaka = Location.create!(user: @user, name: "大阪", score_weight: 4, active: true, display_order: 1)
    @backend = Position.create!(user: @user, name: "Aバックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @frontend = Position.create!(user: @user, name: "Zフロントエンドエンジニア", score_weight: 5, active: true, display_order: 1)
    @rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    @react = TechStack.create!(user: @user, name: "React", score_weight: 8, active: true, display_order: 1)

    @backend_job = create_job(
      company_name: "Rails 株式会社",
      position: @backend,
      location: @tokyo,
      tech_stacks: [ @rails ],
      work_style: "full_remote",
      salary_max: 7_000_000,
      updated_at: Time.zone.parse("2026-04-03 10:00:00")
    )
    @frontend_job = create_job(
      company_name: "React 株式会社",
      position: @frontend,
      location: @osaka,
      tech_stacks: [ @react ],
      work_style: "hybrid",
      salary_max: 8_000_000,
      updated_at: Time.zone.parse("2026-04-02 10:00:00")
    )
    @onsite_job = create_job(
      company_name: "出社開発株式会社",
      position: @backend,
      location: @osaka,
      tech_stacks: [ @rails, @react ],
      work_style: "onsite",
      salary_max: 6_000_000,
      updated_at: Time.zone.parse("2026-04-01 10:00:00")
    )
  end

  test "searches by keyword across company, notes, position, location and tech stack" do
    assert_equal [ @backend_job.id, @onsite_job.id ], result_ids(keyword: "Rails")
    assert_equal [ @frontend_job.id ], result_ids(keyword: "大阪", work_style: "hybrid")
    assert_equal [ @frontend_job.id ], result_ids(keyword: "フロントエンド")
  end

  test "filters by position, location and work style" do
    result_ids = result_ids(
      position_id: @backend.id,
      location_id: @osaka.id,
      work_style: "onsite"
    )

    assert_equal [ @onsite_job.id ], result_ids
  end

  test "sorts by position when keyword search is present" do
    assert_equal [ @backend_job.id, @onsite_job.id, @frontend_job.id ],
      result_ids(keyword: "株式会社", sort: "position", direction: "asc")
    assert_equal [ @frontend_job.id, @backend_job.id, @onsite_job.id ],
      result_ids(keyword: "株式会社", sort: "position", direction: "desc")
  end

  test "uses only whitelisted sort columns" do
    assert_equal [ @onsite_job.id, @backend_job.id, @frontend_job.id ], result_ids(sort: "salary_max", direction: "asc")
  end

  test "falls back to updated_at when sort is invalid" do
    assert_equal [ @backend_job.id, @frontend_job.id, @onsite_job.id ],
      result_ids(sort: "score desc; DROP TABLE jobs", direction: "sideways")
  end

  test "caps per_page at the maximum" do
    query = query(per_page: 10_000)

    assert_equal JobsQuery::MAX_PER_PAGE, query.per_page
  end

  test "calculates recommendations from all matching jobs beyond the page limit" do
    Job.update_all(score: 0)
    jobs = 101.times.map do |index|
      job = create_job(
        company_name: "大量求人 #{index}",
        position: @backend,
        location: @tokyo,
        tech_stacks: [ @rails ]
      )
      job.update_column(:score, 100 - index)
      job
    end

    recommended_ids = query(per_page: 10_000).recommended_job_ids

    assert_equal 100, query(per_page: 10_000).results.count
    assert_equal jobs.first(11).map(&:id).sort, recommended_ids.sort
  end

  test "does not recommend rejected jobs" do
    @backend_job.update_columns(score: 100, status: "rejected")
    @frontend_job.update_column(:score, 80)
    @onsite_job.update_column(:score, 60)

    assert_equal [ @frontend_job.id ], query.recommended_job_ids
  end

  test "limits recommendations to the top decile when scores are tied" do
    10.times do |index|
      job = create_job(
        company_name: "同点求人 #{index}",
        position: @backend,
        location: @tokyo,
        tech_stacks: [ @rails ]
      )
      job.update_column(:score, 80)
    end
    Job.where(id: [ @backend_job.id, @frontend_job.id, @onsite_job.id ]).update_all(score: 80)

    recommended_ids = query.recommended_job_ids

    assert_equal 2, recommended_ids.length
    assert_equal Job.where(user: @user).order(:id).limit(2).pluck(:id), recommended_ids
  end

  private

  def query(params = {})
    JobsQuery.new(params: params, scope: @user.jobs)
  end

  def result_ids(params = {})
    query(params).results.to_a.map(&:id)
  end

  def create_job(attributes)
    tech_stacks = attributes.delete(:tech_stacks)
    job = Job.new({
      user: @user,
      status: "interested",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      notes: "検索メモ",
      created_at: Time.current
    }.merge(attributes))
    job.tech_stacks = tech_stacks
    job.save!
    job
  end
end
