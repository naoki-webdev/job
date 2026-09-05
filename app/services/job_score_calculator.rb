class JobScoreCalculator
  def self.call(job, preference: nil)
    new(job, preference: preference).call
  end

  def initialize(job, preference: nil)
    @job = job
    @preference = preference
  end

  def call
    return 0 unless job.user

    preference = @preference || ScoringPreference.for_calculation(user: job.user)

    work_style_score(preference) +
      job.position&.score_weight.to_i +
      job.location&.score_weight.to_i +
      job.tech_stacks.map(&:score_weight).sum +
      salary_score(preference)
  end

  private

  attr_reader :job

  def work_style_score(preference)
    return preference.full_remote_weight if job.full_remote?
    return preference.hybrid_weight if job.hybrid?
    return preference.onsite_weight if job.onsite?

    0
  end

  def salary_score(preference)
    total = 0
    total += preference.high_salary_bonus if job.salary_max.to_i >= preference.high_salary_max_threshold
    total += preference.low_salary_penalty if job.salary_min.to_i < preference.low_salary_min_threshold
    total
  end
end
