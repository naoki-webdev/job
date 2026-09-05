require "test_helper"

class AdminUserProvisionerTest < ActiveSupport::TestCase
  setup do
    @original_env = ENV.to_h.slice("ADMIN_USER_EMAIL", "ADMIN_USER_PASSWORD", "ADMIN_USER_NAME")
    ENV.delete("ADMIN_USER_EMAIL")
    ENV.delete("ADMIN_USER_PASSWORD")
    ENV.delete("ADMIN_USER_NAME")
  end

  teardown do
    ENV.delete("ADMIN_USER_EMAIL")
    ENV.delete("ADMIN_USER_PASSWORD")
    ENV.delete("ADMIN_USER_NAME")
    @original_env.each { |key, value| ENV[key] = value }
  end

  test "skips when admin credentials are not configured" do
    assert_equal :skipped, AdminUserProvisioner.call
  end

  test "creates an AI enabled writable admin user" do
    ENV["ADMIN_USER_EMAIL"] = "Admin@Example.com "
    ENV["ADMIN_USER_PASSWORD"] = "strong-password"
    ENV["ADMIN_USER_NAME"] = "本番管理者"

    assert_difference -> { User.count }, 1 do
      assert_equal :provisioned, AdminUserProvisioner.call
    end

    user = User.find_by!(email: "admin@example.com")
    assert_equal "本番管理者", user.name
    assert user.authenticate("strong-password")
    assert user.ai_enabled?
    assert_not user.read_only?
    assert_predicate user.scoring_preference, :present?
  end

  test "updates an existing user without creating duplicates" do
    user = create_user(email: "admin@example.com", password: "old-password")
    user.update!(read_only: true, ai_enabled: false)

    ENV["ADMIN_USER_EMAIL"] = "admin@example.com"
    ENV["ADMIN_USER_PASSWORD"] = "new-password"

    assert_no_difference -> { User.count } do
      assert_equal :provisioned, AdminUserProvisioner.call
    end

    user.reload
    assert user.authenticate("new-password")
    assert user.ai_enabled?
    assert_not user.read_only?
  end
end
