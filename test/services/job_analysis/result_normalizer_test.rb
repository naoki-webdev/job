require "test_helper"

module JobAnalysis
  class ResultNormalizerTest < ActiveSupport::TestCase
    test "normalizes untrusted model output into a bounded result" do
      result = ResultNormalizer.new(
        raw: {
          "verdict" => "unknown",
          "summary" => "  要確認  ",
          "confidence" => 2,
          "matches" => [
            { "preference" => "Rails", "reason" => "経験に合う", "evidence" => "Rails" },
            { "preference" => 123, "reason" => "invalid" }
          ],
          "conflicts" => [],
          "unknowns" => [ "給与", 123 ],
          "questions" => [ "雇用形態" ]
        },
        preferences: { "must" => [], "prefer" => [], "avoid" => [], "verify" => [] }
      ).call

      assert_equal "insufficient_information", result["verdict"]
      assert_equal 1, result["matches"].length
      assert_equal 1.0, result["confidence"]
      assert_equal [ "給与" ], result["unknowns"]
      assert_equal [], result["preference_snapshot"]["must"]
    end

    test "preserves a supported advisory verdict when evidence exists" do
      result = ResultNormalizer.new(
        raw: {
          "verdict" => "not_recommended",
          "summary" => "条件が合いません",
          "confidence" => 0.7,
          "matches" => [],
          "conflicts" => [ { "preference" => "勤務地", "reason" => "出社必須", "evidence" => "出社" } ],
          "unknowns" => [],
          "questions" => []
        },
        preferences: {}
      ).call

      assert_equal "not_recommended", result["verdict"]
      assert_equal 0.7, result["confidence"]
    end
  end
end
