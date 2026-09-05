class InterviewQuestion < ApplicationRecord
  include EvaluationRuleRecord

  validates :body, presence: true, length: { maximum: 500 }
end
