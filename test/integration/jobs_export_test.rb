require "test_helper"
require "csv"

class JobsExportTest < ActionDispatch::IntegrationTest
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

    @user = create_user(email: "jobs-export@example.com")
    @headers = auth_headers(@user)
  end

  test "export returns localized csv with utf-8 bom" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    backend = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)

    job = Job.new(
      user: @user,
      company_name: "サンプル会社 1",
      position: backend,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 4_500_000,
      salary_max: 6_000_000,
      location: location,
      notes: "候補メモ"
    )
    job.tech_stacks = [ rails ]
    job.save!

    get "/api/jobs/export", headers: @headers

    assert_response :success
    assert_equal "text/csv; charset=utf-8", response.media_type + "; charset=" + response.charset
    assert_match(/\A\uFEFF/, response.body)

    csv = CSV.parse(response.body.delete_prefix("\uFEFF"), headers: true)

    assert_equal I18n.t("csv.headers.company_name", locale: :ja), csv.headers[1]
    assert_equal I18n.t("csv.headers.status", locale: :ja), csv.headers[3]
    assert_equal I18n.t("csv.headers.work_style", locale: :ja), csv.headers[4]
    assert_equal I18n.t("csv.headers.employment_type", locale: :ja), csv.headers[5]

    row = csv.first
    assert_equal "サンプル会社 1", row[I18n.t("csv.headers.company_name", locale: :ja)]
    assert_equal "バックエンドエンジニア", row[I18n.t("csv.headers.position", locale: :ja)]
    assert_equal I18n.t("csv.enums.status.interested", locale: :ja), row[I18n.t("csv.headers.status", locale: :ja)]
    assert_equal I18n.t("csv.enums.work_style.full_remote", locale: :ja), row[I18n.t("csv.headers.work_style", locale: :ja)]
    assert_equal I18n.t("csv.enums.employment_type.full_time", locale: :ja), row[I18n.t("csv.headers.employment_type", locale: :ja)]
    assert_equal "Ruby on Rails", row[I18n.t("csv.headers.tech_stack", locale: :ja)]
    assert_equal "東京", row[I18n.t("csv.headers.location", locale: :ja)]
    assert_equal "候補メモ", row[I18n.t("csv.headers.notes", locale: :ja)]
  end

  test "neutralizes spreadsheet formulas in string cells" do
    location = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    position = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    job = Job.new(
      user: @user,
      company_name: "=HYPERLINK(\"https://example.com\")",
      position: position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 4_500_000,
      salary_max: 6_000_000,
      location: location,
      notes: "+1+1"
    )
    job.tech_stacks = [ rails ]
    job.save!

    get "/api/jobs/export", headers: @headers

    assert_response :success
    csv = CSV.parse(response.body.delete_prefix("\uFEFF"), headers: true)
    row = csv.first

    assert_equal "'=HYPERLINK(\"https://example.com\")", row[I18n.t("csv.headers.company_name", locale: :ja)]
    assert_equal "'+1+1", row[I18n.t("csv.headers.notes", locale: :ja)]
  end
end
