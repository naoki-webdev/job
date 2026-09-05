class TechStack < ApplicationRecord
  include MasterDataRecord

  belongs_to :user
  has_many :job_tech_stacks, dependent: :restrict_with_error
  has_many :jobs, through: :job_tech_stacks

  private

  def jobs_for_score_refresh
    jobs.distinct
  end
end
