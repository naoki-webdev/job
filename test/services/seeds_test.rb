require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  setup do
    UserSession.delete_all
    JobTechStack.delete_all
    Job.delete_all
    ScoringPreference.delete_all
    ActivityLog.delete_all
    PositiveKeyword.delete_all
    NegativeKeyword.delete_all
    InterviewQuestion.delete_all
    Location.delete_all
    Position.delete_all
    TechStack.delete_all
    User.delete_all
  end

  test "is repeatable without deleting existing sessions or duplicating demo data" do
    Rails.application.load_seed

    counts = {
      users: User.count,
      jobs: Job.count,
      positions: Position.count,
      locations: Location.count,
      tech_stacks: TechStack.count,
      scoring_preferences: ScoringPreference.count
    }
    _session, = UserSession.issue(User.find_by!(email: "demo@example.com"))

    assert_nothing_raised { Rails.application.load_seed }

    assert_equal counts[:users], User.count
    assert_equal counts[:jobs], Job.count
    assert_equal counts[:positions], Position.count
    assert_equal counts[:locations], Location.count
    assert_equal counts[:tech_stacks], TechStack.count
    assert_equal counts[:scoring_preferences], ScoringPreference.count
    assert UserSession.exists?
  end
end
