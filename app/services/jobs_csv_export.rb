require "csv"

class JobsCsvExport
  CSV_UTF8_BOM = "\uFEFF"
  RESPONSE_FIELDS = %w[
    id company_name position status work_style employment_type
    salary_min salary_max tech_stack location notes score created_at updated_at
  ].freeze

  def initialize(jobs, locale: nil)
    @jobs = jobs
    @locale = locale
  end

  def call
    csv = I18n.with_locale(export_locale) do
      CSV.generate(headers: true) do |rows|
        rows << csv_headers

        @jobs.each do |job|
          rows << csv_row(job)
        end
      end
    end

    "#{CSV_UTF8_BOM}#{csv}"
  end

  def filename(timestamp = Time.current)
    "jobs-#{timestamp.strftime('%Y%m%d%H%M%S')}.csv"
  end

  private

  def export_locale
    @locale || (I18n.available_locales.include?(:ja) ? :ja : I18n.default_locale)
  end

  def csv_headers
    RESPONSE_FIELDS.map do |field|
      I18n.t("csv.headers.#{field}", default: field)
    end
  end

  def csv_row(job)
    RESPONSE_FIELDS.map do |field|
      csv_value(job, field)
    end
  end

  def csv_value(job, field)
    value = case field
    when "position"
      job.position_name
    when "tech_stack"
      job.tech_stack_names
    when "location"
      job.location_name
    else
      job.public_send(field)
    end

    case field
    when "status", "work_style", "employment_type"
      I18n.t("csv.enums.#{field}.#{value}", default: value)
    when "created_at", "updated_at"
      I18n.l(value.in_time_zone("Asia/Tokyo"), format: :csv)
    else
      value
    end.then { |formatted_value| neutralize_formula(formatted_value) }
  end

  def neutralize_formula(value)
    return value unless value.is_a?(String)
    return value unless value.match?(/\A[=+\-@]/)

    "'#{value}"
  end
end
