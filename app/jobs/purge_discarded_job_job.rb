class PurgeDiscardedJobJob < ApplicationJob
  queue_as :default

  def perform(job_id)
    job = Job.unscoped.where("discarded_at <= ?", 30.seconds.ago).find_by(id: job_id)
    job&.destroy!
  end
end
