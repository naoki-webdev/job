class PositiveKeyword < ApplicationRecord
  include EvaluationRuleRecord

  validates :pattern, presence: true, length: { maximum: 255 },
    uniqueness: { scope: :user_id, case_sensitive: false }
  validates :label, presence: true, length: { maximum: 255 }
end
