require "test_helper"

class AdminMasterDataBackfillsApiTest < ActionDispatch::IntegrationTest
  setup do
    @previous_admin_email = ENV["ADMIN_USER_EMAIL"]
    ENV["ADMIN_USER_EMAIL"] = "admin@example.com"
    @admin = create_user(email: "admin@example.com")
    @regular_user = create_user(email: "regular@example.com")
  end

  teardown do
    ENV.delete("ADMIN_USER_EMAIL")
    ENV["ADMIN_USER_EMAIL"] = @previous_admin_email if @previous_admin_email
  end

  test "rejects a non-admin without creating master data" do
    post "/api/admin/master_data_backfill", headers: auth_headers(@regular_user)

    assert_response :forbidden
    assert_equal 0, @regular_user.positions.count
    assert_nil @regular_user.reload.default_master_data_initialized_at
  end

  test "backfills once without overwriting existing data or duplicating defaults" do
    custom_position = @admin.positions.create!(
      name: "バックエンドエンジニア",
      score_weight: 99,
      active: true,
      display_order: 0
    )

    post "/api/admin/master_data_backfill", headers: auth_headers(@admin)

    assert_response :success
    assert_equal 99, custom_position.reload.score_weight
    assert_equal 4, @admin.positions.count
    assert_equal 5, @admin.locations.count
    assert_equal 8, @admin.tech_stacks.count
    assert_equal 4, @admin.positive_keywords.count
    assert_equal 3, @admin.negative_keywords.count
    assert_equal 3, @admin.interview_questions.count

    counts = [
      @admin.positions.count,
      @admin.locations.count,
      @admin.tech_stacks.count,
      @admin.positive_keywords.count,
      @admin.negative_keywords.count,
      @admin.interview_questions.count
    ]

    post "/api/admin/master_data_backfill", headers: auth_headers(@admin)

    assert_response :conflict
    assert_equal counts, [
      @admin.positions.count,
      @admin.locations.count,
      @admin.tech_stacks.count,
      @admin.positive_keywords.count,
      @admin.negative_keywords.count,
      @admin.interview_questions.count
    ]
  end

  test "rolls back a failed backfill and allows retry" do
    failing_backfill = lambda do |user:|
      user.positions.create!(name: "一時レコード", score_weight: 1, active: true, display_order: 0)
      raise "simulated backfill failure"
    end

    DefaultMasterDataProvisioner.stub(:call, failing_backfill) do
      post "/api/admin/master_data_backfill", headers: auth_headers(@admin)
    end

    assert_response :internal_server_error
    assert_equal 0, @admin.positions.count
    assert_nil @admin.reload.default_master_data_initialized_at

    post "/api/admin/master_data_backfill", headers: auth_headers(@admin)

    assert_response :success
    assert_predicate @admin.reload.default_master_data_initialized_at, :present?
    assert_equal 4, @admin.positions.count
  end
end
