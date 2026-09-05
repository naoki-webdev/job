module EvaluationRuleRecord
  extend ActiveSupport::Concern

  included do
    belongs_to :user
    validates :display_order, presence: true, numericality: { only_integer: true }
    scope :active, -> { where(active: true) }
    scope :ordered, -> { order(:display_order, :id) }
  end
end
