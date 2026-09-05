module MasterDataRecord
  extend ActiveSupport::Concern

  included do
    validates :name, presence: true, uniqueness: { scope: :user_id }
    validates :score_weight, :display_order, presence: true
    validates :score_weight, :display_order, numericality: { only_integer: true }
    validates :display_order, numericality: { greater_than_or_equal_to: 0 }

    scope :active, -> { where(active: true) }
    scope :ordered, -> { order(:display_order, :id) }

    before_update :lock_user_for_score_refresh, if: :will_save_change_to_score_weight?
    after_update :refresh_jobs!, if: :saved_change_to_score_weight?
  end

  private

  def lock_user_for_score_refresh
    User.lock.find(user_id)
  end

  def refresh_jobs!
    job_ids = jobs_for_score_refresh.distinct.pluck(:id)
    RecalculateJobScores.call(job_ids: job_ids) if job_ids.any?
  end

  def jobs_for_score_refresh
    jobs
  end
end
