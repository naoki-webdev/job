class JobScoreCalculator
  def self.call(job, preference: nil, fresh_master_weights: false)
    new(job, preference: preference, fresh_master_weights: fresh_master_weights).call
  end

  def initialize(job, preference: nil, fresh_master_weights: false)
    @job = job
    @preference = preference
    @fresh_master_weights = fresh_master_weights
  end

  def call
    return 0 unless job.user

    preference = @preference || ScoringPreference.for_calculation(user: job.user)

    work_style_score(preference) +
      master_score +
      salary_score(preference)
  end

  private

  attr_reader :job

  def master_score
    records = [ job.position, job.location, *job.tech_stacks ].compact
    return records.sum { |record| record.score_weight.to_i } unless @fresh_master_weights

    # Job saves hold the owner lock here. Validation may have cached older
    # masters before that lock, but reloading relations would lose pending
    # assignments on a new job. Refresh only the weights used for calculation.
    records.group_by(&:class).sum do |model, assigned|
      weights = model.uncached do
        model.where(id: assigned.filter_map(&:id)).pluck(:id, :score_weight).to_h
      end
      assigned.sum { |record| record.persisted? ? weights.fetch(record.id, 0).to_i : record.score_weight.to_i }
    end
  end

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
