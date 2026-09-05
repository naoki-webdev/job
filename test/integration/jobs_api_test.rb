require "test_helper"
require "tempfile"

class JobsApiTest < ActionDispatch::IntegrationTest
  setup do
    ActiveStorage::Attachment.delete_all
    ActiveStorage::Blob.delete_all
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

    @user = create_user(email: "jobs-api@example.com")
    @other_user = create_user(email: "other-jobs-api@example.com")
    @headers = auth_headers(@user)
    @tokyo = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
    @osaka = Location.create!(user: @user, name: "大阪", score_weight: 4, active: true, display_order: 1)
    @fukuoka = Location.create!(user: @user, name: "福岡", score_weight: 3, active: true, display_order: 2)
    @backend = Position.create!(user: @user, name: "バックエンドエンジニア", score_weight: 8, active: true, display_order: 0)
    @frontend = Position.create!(user: @user, name: "フロントエンドエンジニア", score_weight: 5, active: true, display_order: 1)
    @rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 0)
    @typescript = TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)
    @react = TechStack.create!(user: @user, name: "React", score_weight: 8, active: true, display_order: 2)
    @other_location = Location.create!(user: @other_user, name: "他ユーザーの勤務地", score_weight: 1, active: true, display_order: 0)
    @other_position = Position.create!(user: @other_user, name: "他ユーザーの職種", score_weight: 1, active: true, display_order: 0)
    @other_tech_stack = TechStack.create!(user: @other_user, name: "他ユーザーの技術", score_weight: 1, active: true, display_order: 0)

    @job1 = Job.new(
      user: @user,
      company_name: "サンプル会社 A",
      position: @backend,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @tokyo,
      notes: "第一候補",
      updated_at: Time.zone.parse("2026-04-02 10:00:00")
    )
    @job1.tech_stacks = [ @rails, @typescript ]
    @job1.save!

    @job2 = Job.new(
      user: @user,
      company_name: "サンプル会社 B",
      position: @frontend,
      status: "offer",
      work_style: "hybrid",
      employment_type: "contract",
      salary_min: 5_500_000,
      salary_max: 7_500_000,
      location: @osaka,
      notes: "内定済み",
      updated_at: Time.zone.parse("2026-04-01 10:00:00")
    )
    @job2.tech_stacks = [ @react, @typescript ]
    @job2.save!
  end

  test "index returns filtered jobs with master data" do
    get "/api/jobs", params: { keyword: "バックエンド", status: "interested", work_style: "full_remote" }, headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["jobs"].length
    assert_equal @job1.id, body["jobs"].first["id"]
    assert_equal @backend.id, body["jobs"].first["position_id"]
    assert_equal @tokyo.id, body["jobs"].first["location_id"]
    assert_equal 2, body["jobs"].first["tech_stack_ids"].length
    assert_equal 1, body["meta"]["total_count"]
    assert_equal 1, body["meta"]["summary"]["remote_friendly"]
    assert_equal 1, body["meta"]["summary"]["active_pipeline"]
    assert_equal 1, body["meta"]["summary"]["high_score"]
    assert_equal [ @job1.id ], body["meta"]["recommended_job_ids"]
  end

  test "index searches by associated location and tech stack names" do
    get "/api/jobs", params: { keyword: "大阪" }, headers: @headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [ @job2.id ], body["jobs"].map { |job| job["id"] }

    get "/api/jobs", params: { keyword: "React" }, headers: @headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [ @job2.id ], body["jobs"].map { |job| job["id"] }
  end

  test "rejects malformed master data filters instead of ignoring them" do
    get "/api/jobs", params: { position_id: "abc" }, headers: @headers

    assert_response :bad_request

    body = JSON.parse(response.body)
    assert_equal "INVALID_FILTER", body["code"]
    assert_equal [ "絞り込み条件が正しくありません。" ], body["errors"]
    assert body["request_id"].present?
  end

  test "index sorts jobs by salary_max ascending" do
    get "/api/jobs", params: { sort: "salary_max", direction: "asc" }, headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal [ @job1.id, @job2.id ], body["jobs"].map { |job| job["id"] }
  end

  test "show returns detailed job response with associated data" do
    get "/api/jobs/#{@job1.id}", headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal @job1.id, body["id"]
    assert_equal @backend.id, body["position_id"]
    assert_equal @tokyo.id, body["location_id"]
    assert_equal "バックエンドエンジニア", body["position"]
    assert_equal "東京", body["location"]
    assert_equal [ @rails.id, @typescript.id ].sort, body["tech_stack_ids"].sort
    assert_equal 2, body["tech_stacks"].length
    assert_equal @backend.id, body["position_master"]["id"]
    assert_equal @tokyo.id, body["location_master"]["id"]
    assert_nil body["company_logo_url"]
    assert_nil body["company_logo_filename"]
  end

  test "update changes status and keeps existing master associations" do
    patch "/api/jobs/#{@job1.id}", params: { job: { status: "interviewing" } }, headers: @headers, as: :json

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal "interviewing", body["status"]
    assert_equal "job.update", ActivityLog.last.action
    assert_equal @user.id, ActivityLog.last.user_id
    assert_equal "Ruby on Rails, TypeScript", body["tech_stack"]
    assert_equal "interviewing", @job1.reload.status
    assert_equal 2, @job1.tech_stacks.count
  end

  test "create persists a new job with master ids" do
    assert_difference("Job.count", 1) do
      post "/api/jobs",
        params: {
          job: {
            company_name: "サンプル会社 C",
            position_id: @backend.id,
            status: "applied",
            work_style: "onsite",
            employment_type: "full_time",
            salary_min: 6_000_000,
            salary_max: 8_000_000,
            tech_stack_ids: [ @react.id, @typescript.id ],
            location_id: @fukuoka.id,
            notes: "新規追加"
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :created

    body = JSON.parse(response.body)

    assert_equal "サンプル会社 C", body["company_name"]
    assert_equal "バックエンドエンジニア", body["position"]
    assert_equal [ @react.id, @typescript.id ].sort, body["tech_stack_ids"].sort
    assert_equal "job.create", ActivityLog.last.action
    assert_equal @user.id, ActivityLog.last.user_id
  end

  test "rejects inactive masters when creating a job" do
    [
      [ @backend, { position_id: @backend.id } ],
      [ @tokyo, { location_id: @tokyo.id } ],
      [ @rails, { tech_stack_ids: [ @rails.id ] } ]
    ].each_with_index do |(master, overrides), index|
      master.update!(active: false)

      assert_no_difference("Job.count") do
        post "/api/jobs",
          params: {
            job: {
              company_name: "無効マスタの求人 #{index}",
              position_id: @backend.id,
              status: "interested",
              work_style: "hybrid",
              employment_type: "full_time",
              salary_min: 5_000_000,
              salary_max: 7_000_000,
              tech_stack_ids: [ @rails.id ],
              location_id: @tokyo.id,
              notes: ""
            }.merge(overrides)
          },
          headers: @headers,
          as: :json
      end

      assert_response :unprocessable_entity
      assert_includes JSON.parse(response.body)["errors"].join, "active"
      master.update!(active: true)
    end
  end

  test "allows an existing job to keep its inactive masters" do
    @backend.update!(active: false)
    @tokyo.update!(active: false)
    @rails.update!(active: false)

    patch "/api/jobs/#{@job1.id}",
      params: {
        job: {
          position_id: @backend.id,
          location_id: @tokyo.id,
          tech_stack_ids: [ @rails.id, @typescript.id ]
        }
      },
      headers: @headers,
      as: :json

    assert_response :success
    assert_equal @backend.id, @job1.reload.position_id
    assert_equal @tokyo.id, @job1.location_id
    assert_equal [ @rails.id, @typescript.id ].sort, @job1.tech_stack_ids.sort
  end

  test "rejects tech stacks owned by another user instead of silently dropping them" do
    assert_no_difference("Job.count") do
      post "/api/jobs",
        params: {
          job: {
            company_name: "不正なマスタ参照",
            position_id: @backend.id,
            status: "interested",
            work_style: "hybrid",
            employment_type: "full_time",
            salary_min: 5_000_000,
            salary_max: 7_000_000,
            tech_stack_ids: [ @other_tech_stack.id ],
            location_id: @tokyo.id,
            notes: ""
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"].join, "current user"
  end

  test "rejects malformed tech stack ids with a validation response" do
    post "/api/jobs",
      params: {
        job: {
          company_name: "不正なID",
          position_id: @backend.id,
          status: "interested",
          work_style: "hybrid",
          employment_type: "full_time",
          salary_min: 5_000_000,
          salary_max: 7_000_000,
          tech_stack_ids: "not-an-array",
          location_id: @tokyo.id,
          notes: ""
        }
      },
      headers: @headers,
      as: :json

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"].join, "array"
  end

  test "create attaches a company logo" do
    logo = Rack::Test::UploadedFile.new(
      Rails.root.join("test/fixtures/files/company-logo.svg"),
      "image/svg+xml"
    )

    assert_difference("Job.count", 1) do
      post "/api/jobs",
        params: {
          job: {
            company_name: "ロゴ付き会社",
            position_id: @backend.id,
            status: "applied",
            work_style: "hybrid",
            employment_type: "full_time",
            salary_min: 6_000_000,
            salary_max: 8_000_000,
            tech_stack_ids: [ @rails.id ],
            location_id: @tokyo.id,
            notes: "",
            company_logo: logo
          }
        },
        headers: @headers
    end

    assert_response :created

    body = JSON.parse(response.body)
    job = Job.find(body["id"])

    assert job.company_logo.attached?
    assert_equal "company-logo.svg", body["company_logo_filename"]
    assert_includes body["company_logo_url"], "/rails/active_storage/blobs/redirect/"
  end

  test "rejects a file that only declares an image content type" do
    Tempfile.create([ "fake-logo", ".png" ]) do |file|
      file.write("not an image")
      file.rewind
      upload = Rack::Test::UploadedFile.new(file.path, "image/png")

      assert_no_difference("Job.count") do
        post "/api/jobs",
          params: {
            job: {
              company_name: "不正なロゴ",
              position_id: @backend.id,
              status: "applied",
              work_style: "hybrid",
              employment_type: "full_time",
              salary_min: 6_000_000,
              salary_max: 8_000_000,
              tech_stack_ids: [ @react.id ],
              location_id: @tokyo.id,
              notes: "",
              company_logo: upload
            }
          },
          headers: @headers
      end
    end

    assert_response :unprocessable_entity
  end

  test "update removes an attached company logo" do
    @job1.company_logo.attach(
      io: Rails.root.join("test/fixtures/files/company-logo.svg").open,
      filename: "company-logo.svg",
      content_type: "image/svg+xml"
    )

    assert @job1.company_logo.attached?

    patch "/api/jobs/#{@job1.id}",
      params: {
        job: {
          remove_company_logo: "1"
        }
      },
      headers: @headers

    assert_response :success

    body = JSON.parse(response.body)

    assert_not @job1.reload.company_logo.attached?
    assert_nil body["company_logo_url"]
    assert_nil body["company_logo_filename"]
  end

  test "update keeps company logo when validation fails" do
    @job1.company_logo.attach(
      io: Rails.root.join("test/fixtures/files/company-logo.svg").open,
      filename: "company-logo.svg",
      content_type: "image/svg+xml"
    )

    patch "/api/jobs/#{@job1.id}",
      params: {
        job: {
          salary_min: 8_000_000,
          salary_max: 7_000_000,
          remove_company_logo: "1"
        }
      },
      headers: @headers

    assert_response :unprocessable_entity
    assert @job1.reload.company_logo.attached?
  end

  test "create allows blank notes" do
    assert_difference("Job.count", 1) do
      post "/api/jobs",
        params: {
          job: {
            company_name: "サンプル会社 D",
            position_id: @backend.id,
            status: "interested",
            work_style: "hybrid",
            employment_type: "full_time",
            salary_min: 5_000_000,
            salary_max: 6_500_000,
            tech_stack_ids: [ @rails.id ],
            location_id: @tokyo.id,
            notes: ""
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :created
    assert_equal "", JSON.parse(response.body)["notes"]
  end

  test "destroy removes job" do
    assert_difference("Job.count", -1) do
      delete "/api/jobs/#{@job2.id}", headers: @headers
    end

    assert_response :no_content
    assert_equal "job.destroy", ActivityLog.last.action
    assert_equal "サンプル会社 B", ActivityLog.last.metadata["company_name"]
  end

  test "create returns validation errors when required fields are missing" do
    assert_no_difference("Job.count") do
      post "/api/jobs",
        params: {
          job: {
            company_name: "",
            position_id: nil,
            status: "interested",
            work_style: "hybrid",
            employment_type: "full_time",
            salary_min: 6_000_000,
            salary_max: 5_000_000,
            tech_stack_ids: [],
            location_id: nil,
            notes: ""
          }
        },
        headers: @headers,
        as: :json
    end

    assert_response :unprocessable_entity

    body = JSON.parse(response.body)

    assert_includes body["errors"], "Company name can't be blank"
    assert_includes body["errors"], "Position can't be blank"
    assert_includes body["errors"], "Tech stacks can't be blank"
    assert_includes body["errors"], "Location can't be blank"
    assert_includes body["errors"], "Salary max must be greater than or equal to 6000000"
  end

  test "update returns validation errors for invalid payload" do
    patch "/api/jobs/#{@job1.id}",
      params: {
        job: {
          salary_min: 7_500_000,
          salary_max: 5_000_000
        }
      },
      headers: @headers,
      as: :json

    assert_response :unprocessable_entity

    body = JSON.parse(response.body)

    assert_includes body["errors"], "Salary max must be greater than or equal to 7500000"
  end

  test "update rolls back tech stack changes when validation fails" do
    patch "/api/jobs/#{@job1.id}",
      params: {
        job: {
          salary_min: 7_500_000,
          salary_max: 5_000_000,
          tech_stack_ids: [ @react.id ]
        }
      },
      headers: @headers,
      as: :json

    assert_response :unprocessable_entity
    assert_equal [ @rails.id, @typescript.id ].sort, @job1.reload.tech_stack_ids.sort
  end

  test "index only returns jobs owned by the current user" do
    other_job = Job.new(
      user: @other_user,
      company_name: "他ユーザーの会社",
      position: @other_position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @other_location,
      notes: ""
    )
    other_job.tech_stacks = [ @other_tech_stack ]
    other_job.save!

    get "/api/jobs", headers: @headers

    assert_response :success
    ids = JSON.parse(response.body)["jobs"].map { |job| job["id"] }

    assert_includes ids, @job1.id
    assert_not_includes ids, other_job.id
  end

  test "show rejects jobs owned by another user" do
    other_job = Job.new(
      user: @other_user,
      company_name: "他ユーザーの会社",
      position: @other_position,
      status: "interested",
      work_style: "full_remote",
      employment_type: "full_time",
      salary_min: 5_000_000,
      salary_max: 7_000_000,
      location: @other_location,
      notes: ""
    )
    other_job.tech_stacks = [ @other_tech_stack ]
    other_job.save!

    get "/api/jobs/#{other_job.id}", headers: @headers

    assert_response :not_found
  end

  test "returns a structured error when the job payload is missing" do
    post "/api/jobs", params: {}, headers: @headers, as: :json

    assert_response :bad_request
    body = JSON.parse(response.body)
    assert_equal "INVALID_REQUEST", body["code"]
    assert_equal [ "リクエストが正しくありません。" ], body["errors"]
    assert body["request_id"].present?
  end

  test "returns a structured error when a job is not found" do
    get "/api/jobs/999999", headers: @headers

    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "NOT_FOUND", body["code"]
    assert_equal [ "指定されたデータが見つかりません。" ], body["errors"]
    assert body["request_id"].present?
  end
end
