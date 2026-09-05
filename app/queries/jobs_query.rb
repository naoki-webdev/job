class JobsQuery
  class InvalidFilterError < ArgumentError
    attr_reader :key

    def initialize(key)
      @key = key
      super("#{key} contains an invalid id")
    end
  end

  ACTIVE_PIPELINE_STATUSES = %w[interested applied interviewing].freeze
  SORT_COLUMNS = %w[
    id company_name position status work_style employment_type
    salary_min salary_max score created_at updated_at
  ].freeze
  SORT_DIRECTIONS = %w[asc desc].freeze
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  def initialize(params:, scope: Job.all)
    @params = params
    @scope = scope
  end

  def results
    ordered_scope.offset((page - 1) * per_page).limit(per_page)
  end

  def export_scope
    ordered_scope
  end

  def total_count
    count_for(filtered_scope)
  end

  def summary
    {
      remote_friendly: count_for(filtered_scope.where.not(work_style: "onsite")),
      active_pipeline: count_for(filtered_scope.where(status: ACTIVE_PIPELINE_STATUSES)),
      high_score: count_for(filtered_scope.where("jobs.score >= ?", 50))
    }
  end

  def recommended_job_ids
    @recommended_job_ids ||= begin
      eligible_scope = filtered_scope.where.not(status: "rejected").unscope(:order)
      eligible_count = count_for(eligible_scope)

      if eligible_count.zero?
        []
      else
        recommended_count = [ (eligible_count + 9) / 10, 1 ].max

        eligible_scope
          .order(score: :desc, id: :asc)
          .limit(recommended_count)
          .pluck(:id)
      end
    end
  end

  def page
    raw_page = @params[:page].to_i
    raw_page > 0 ? raw_page : 1
  end

  def per_page
    raw_per_page = @params[:per_page].to_i
    return DEFAULT_PER_PAGE if raw_per_page <= 0

    [ raw_per_page, MAX_PER_PAGE ].min
  end

  private

  def filtered_scope
    @filtered_scope ||= begin
      scoped = @scope
      keyword = @params[:keyword].to_s.strip

      if keyword.present?
        scoped = scoped.where(id: keyword_matching_ids(scoped, keyword))
      end

      if sort_key == "position"
        scoped = scoped.left_joins(:position)
      end

      statuses = @params[:status].to_s.split(",").map(&:strip).reject(&:empty?)
      work_styles = @params[:work_style].to_s.split(",").map(&:strip).reject(&:empty?)
      position_ids = ids_from_param(:position_id)
      location_ids = ids_from_param(:location_id)

      scoped = scoped.where(status: statuses) if statuses.any?
      scoped = scoped.where(work_style: work_styles) if work_styles.any?
      scoped = scoped.where(position_id: position_ids) if position_ids.any?
      scoped = scoped.where(location_id: location_ids) if location_ids.any?
      scoped
    end
  end

  def ordered_scope
    direction = sort_direction == "asc" ? :asc : :desc
    filtered_scope.order(sort_attribute.public_send(direction), Job.arel_table[:id].asc)
  end

  def count_for(scope)
    scope.unscope(:order).count(:id)
  end

  def keyword_matching_ids(scope, keyword)
    escaped_keyword = Job.sanitize_sql_like(keyword)

    scope.left_joins(:position, :location, :tech_stacks)
      .where(
        "jobs.company_name ILIKE :keyword OR jobs.notes ILIKE :keyword OR positions.name ILIKE :keyword OR locations.name ILIKE :keyword OR tech_stacks.name ILIKE :keyword",
        keyword: "%#{escaped_keyword}%"
      )
      .select(:id)
      .distinct
  end

  def sort_key
    column = @params[:sort].to_s
    SORT_COLUMNS.include?(column) ? column : "updated_at"
  end

  def sort_direction
    direction = @params[:direction].to_s.downcase
    SORT_DIRECTIONS.include?(direction) ? direction : "desc"
  end

  def ids_from_param(key)
    raw_param = @params[key]
    return [] if raw_param.blank?

    values = raw_param.to_s.split(",", -1).map(&:strip)
    raise InvalidFilterError, key if values.empty? || values.any?(&:empty?)

    values.map do |raw_value|
      value = Integer(raw_value, exception: false)
      raise InvalidFilterError, key unless value&.positive?

      value
    end
  end

  def sort_attribute
    case sort_key
    when "id" then Job.arel_table[:id]
    when "company_name" then Job.arel_table[:company_name]
    when "position" then Position.arel_table[:name]
    when "status" then Job.arel_table[:status]
    when "work_style" then Job.arel_table[:work_style]
    when "employment_type" then Job.arel_table[:employment_type]
    when "salary_min" then Job.arel_table[:salary_min]
    when "salary_max" then Job.arel_table[:salary_max]
    when "score" then Job.arel_table[:score]
    when "created_at" then Job.arel_table[:created_at]
    else Job.arel_table[:updated_at]
    end
  end
end
