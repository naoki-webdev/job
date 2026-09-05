require "test_helper"

module JobDrafts
  class ScoreEstimatorTest < ActiveSupport::TestCase
    test "returns nil when there are no insights" do
      assert_nil ScoreEstimator.call(pros: [], cons: [])
    end

    test "calculates and clamps the estimate from whitelisted insights" do
        assert_equal 59, ScoreEstimator.call(pros: [ "a", "b", "c" ], cons: [ "d" ])
      assert_equal 100, ScoreEstimator.call(pros: Array.new(20), cons: [])
      assert_equal 0, ScoreEstimator.call(pros: [], cons: Array.new(20))
    end
  end
end
