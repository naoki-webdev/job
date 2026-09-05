class JobTechStack < ApplicationRecord
  belongs_to :job
  belongs_to :tech_stack

  validates :job_id, uniqueness: { scope: :tech_stack_id }
end
