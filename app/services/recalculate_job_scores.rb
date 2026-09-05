class RecalculateJobScores
  def self.call(job_ids: nil, user_id: nil)
    new(job_ids: job_ids, user_id: user_id).call
  end

  def initialize(job_ids: nil, user_id: nil)
    @job_ids = job_ids
    @user_id = user_id
  end

  def call
    Job.transaction do
      lock_users!
      preferences = scoring_preferences

      scope.find_each do |job|
        preference = preferences.fetch(job.user_id) { ScoringPreference.new(user_id: job.user_id) }
        job.update_column(:score, JobScoreCalculator.call(job, preference: preference))
      end
    end
  end

  private

  attr_reader :job_ids, :user_id

  def base_scope
    jobs = Job.all
    jobs = jobs.where(id: job_ids) unless job_ids.nil?
    jobs = jobs.where(user_id: user_id) if user_id.present?
    jobs
  end

  def scope
    base_scope.includes(:user, :position, :location, :tech_stacks)
  end

  def scoring_preferences
    preferences = ScoringPreference.where(user_id: affected_user_ids).index_by(&:user_id)

    affected_user_ids.each do |id|
      preferences[id] ||= ScoringPreference.new(user_id: id)
    end

    preferences
  end

  def affected_user_ids
    @affected_user_ids ||= base_scope.distinct.order(:user_id).pluck(:user_id).compact
  end

  def lock_users!
    affected_user_ids.each { |id| User.lock.find(id) }
  end
end
