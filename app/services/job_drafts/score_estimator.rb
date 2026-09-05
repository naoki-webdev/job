module JobDrafts
  class ScoreEstimator
    BASE_SCORE = 50
    POSITIVE_WEIGHT = 5
    NEGATIVE_WEIGHT = 6
    def self.call(pros:, cons:)
      return nil if pros.empty? && cons.empty?

      (BASE_SCORE + pros.size * POSITIVE_WEIGHT - cons.size * NEGATIVE_WEIGHT).clamp(0, 100)
    end
  end
end
