class ScoringPreference < ApplicationRecord
  belongs_to :user

  validates :user, presence: true
  validates :user_id, uniqueness: true
  validates :full_remote_weight, :hybrid_weight, :onsite_weight, presence: true
  validates :high_salary_max_threshold, :high_salary_bonus, presence: true
  validates :low_salary_min_threshold, :low_salary_penalty, presence: true
  validates :full_remote_weight, :hybrid_weight, :onsite_weight,
    :high_salary_max_threshold, :high_salary_bonus, :low_salary_min_threshold, :low_salary_penalty,
    numericality: { only_integer: true }
  validates :high_salary_max_threshold, :low_salary_min_threshold, numericality: { greater_than_or_equal_to: 0 }
  validate :salary_thresholds_are_ordered

  before_update :lock_user_for_score_recalculation
  after_update :recalculate_job_scores!

  def self.current(user:)
    find_or_create_by!(user: user)
  end

  def self.for_calculation(user:)
    find_by(user: user) || new(user: user)
  end

  private

  def salary_thresholds_are_ordered
    return unless high_salary_max_threshold.present? && low_salary_min_threshold.present?
    return unless high_salary_max_threshold < low_salary_min_threshold

    errors.add(:high_salary_max_threshold, "must be greater than or equal to the low salary threshold")
  end

  def lock_user_for_score_recalculation
    User.lock.find(user_id)
  end

  def recalculate_job_scores!
    RecalculateJobScores.call(user_id: user_id)
  end
end
