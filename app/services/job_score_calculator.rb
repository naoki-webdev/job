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
    breakdown.sum { |item| item.fetch("value") }
  end

  def breakdown
    return [] unless job.user

    preference = @preference || ScoringPreference.for_calculation(user: job.user)
    items = []

    work_style_value = work_style_score(preference)
    items << {
      "category" => "work_style",
      "key" => job.work_style,
      "label" => nil,
      "value" => work_style_value
    } if job.work_style.present?

    master_records.each do |record|
      items << {
        "category" => "master",
        "key" => master_key(record),
        "label" => record.name,
        "value" => master_weight(record)
      }
    end

    if job.salary_max.to_i >= preference.high_salary_max_threshold
      items << {
        "category" => "salary",
        "key" => "high_salary",
        "label" => nil,
        "value" => preference.high_salary_bonus
      }
    end

    if job.salary_min.to_i < preference.low_salary_min_threshold
      items << {
        "category" => "salary",
        "key" => "low_salary",
        "label" => nil,
        "value" => preference.low_salary_penalty
      }
    end

    items
  end

  private

  attr_reader :job

  def master_records
    [ job.position, job.location, *job.tech_stacks ].compact
  end

  def master_key(record)
    case record
    when Position then "position"
    when Location then "location"
    else "tech_stack"
    end
  end

  def master_weight(record)
    return record.score_weight.to_i unless @fresh_master_weights

    # 求人の保存処理では、ここで所有者のロックを保持します。ロック取得前に検証処理が
    # 古いマスターをキャッシュしている可能性がありますが、関連を再読み込みすると
    # 新規求人に対する未反映の割り当てが失われます。計算に使う重みだけを更新します。
    return record.score_weight.to_i unless record.persisted?

    fresh_master_weights.fetch([ record.class, record.id ], 0)
  end

  def fresh_master_weights
    @fresh_master_weights_by_record ||= master_records.group_by(&:class).each_with_object({}) do |(model, records), weights|
      model_weights = model.uncached do
        model.where(id: records.filter_map(&:id)).pluck(:id, :score_weight).to_h
      end
      records.each { |record| weights[[ model, record.id ]] = model_weights.fetch(record.id, 0).to_i }
    end
  end

  def work_style_score(preference)
    return preference.full_remote_weight if job.full_remote?
    return preference.hybrid_weight if job.hybrid?
    return preference.onsite_weight if job.onsite?

    0
  end
end
