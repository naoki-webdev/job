module Api
  class JobsController < ApplicationController
    before_action :set_job, only: [ :show, :update, :destroy ]

    def index
      query = JobsQuery.new(params: params, scope: current_user.jobs)
      jobs = query.results.includes(:position, :location, :tech_stacks).with_attached_company_logo

      render json: {
        jobs: JobSerializer.collection(jobs, url_options: url_options),
        meta: {
          page: query.page,
          per_page: query.per_page,
          total_count: query.total_count,
          summary: query.summary,
          recommended_job_ids: query.recommended_job_ids
        }
      }
    rescue JobsQuery::InvalidFilterError
      render_api_error(
        [ I18n.t("api.errors.invalid_filter", locale: :ja) ],
        status: :bad_request,
        code: "INVALID_FILTER"
      )
    end

    def show
      render json: JobSerializer.new(@job, url_options: url_options).as_json
    end

    def create
      job = current_user.jobs.new(base_job_params)
      assign_master_relations(job)
      attach_company_logo(job)

      Job.transaction do
        job.save!
        record_activity!("job.create", job)
      end
      render json: JobSerializer.new(job, url_options: url_options).as_json, status: :created
    rescue ActiveRecord::RecordInvalid => error
      errors = job.errors.full_messages
      errors = [ error.message ] if errors.empty?
      render_api_error(errors, status: :unprocessable_entity, code: "JOB_VALIDATION_FAILED")
    end

    def update
      remove_company_logo = remove_company_logo_requested?

      Job.transaction do
        @job.assign_attributes(base_job_params)
        assign_master_relations(@job)
        attach_company_logo(@job)
        @job.save!
        record_activity!("job.update", @job)
      end
      if remove_company_logo && !purge_company_logo(@job)
        return render_api_error(
          [ I18n.t("api.errors.company_logo_cleanup_failed", locale: :ja) ],
          status: :service_unavailable,
          code: "STORAGE_CLEANUP_FAILED"
        )
      end

      render json: JobSerializer.new(@job, url_options: url_options).as_json
    rescue ActiveRecord::RecordInvalid => error
      errors = @job.errors.full_messages
      errors = [ error.message ] if errors.empty?
      render_api_error(errors, status: :unprocessable_entity, code: "JOB_VALIDATION_FAILED")
    end

    def destroy
      Job.transaction do
        record_activity!("job.destroy", @job, metadata: { company_name: @job.company_name })
        @job.destroy!
      end
      head :no_content
    end

    def export
      query = JobsQuery.new(params: params, scope: current_user.jobs)
      jobs = query.export_scope.preload(:position, :location, :tech_stacks)
      exporter = JobsCsvExport.new(jobs)

      send_data exporter.call,
        filename: exporter.filename,
        type: "text/csv; charset=utf-8"
    rescue JobsQuery::InvalidFilterError
      render_api_error(
        [ I18n.t("api.errors.invalid_filter", locale: :ja) ],
        status: :bad_request,
        code: "INVALID_FILTER"
      )
    end

    private

    def set_job
      @job = current_user.jobs.includes(:position, :location, :tech_stacks).with_attached_company_logo.find(params[:id])
    end

    def job_params
      params.require(:job)
    end

    def base_job_params
      job_params.permit(
        :company_name,
        :status,
        :work_style,
        :employment_type,
        :salary_min,
        :salary_max,
        :notes,
        :source_url
      )
    end

    def company_logo_param
      job_params[:company_logo]
    end

    def attach_company_logo(job)
      file = company_logo_param
      return if file.blank?

      unless valid_logo_file?(file)
        job.errors.add(:company_logo, "must be a supported image")
        raise ActiveRecord::RecordInvalid.new(job)
      end

      job.company_logo.attach(file)
    end

    def remove_company_logo_requested?
      return if company_logo_param.present?

      ActiveModel::Type::Boolean.new.cast(job_params[:remove_company_logo])
    end

    def purge_company_logo(job)
      job.company_logo.purge
      true
    rescue StandardError => error
      Rails.logger.error("[Api::JobsController] company logo purge failed for Job##{job.id}: #{error.class}: #{error.message}")
      false
    end

    def valid_logo_file?(file)
      return false unless file.respond_to?(:tempfile) && file.respond_to?(:original_filename)

      file.tempfile.rewind
      detected_type = Marcel::MimeType.for(file.tempfile)
      Job::ALLOWED_LOGO_CONTENT_TYPES.include?(detected_type)
    ensure
      file.tempfile.rewind if file.respond_to?(:tempfile) && file.tempfile.respond_to?(:rewind)
    end

    def tech_stack_ids
      raw_ids = job_params.fetch(:tech_stack_ids, [])
      return [] if raw_ids.blank?
      return unless raw_ids.is_a?(Array)

      ids = raw_ids.map { |value| Integer(value, exception: false) }
      return if ids.any?(&:nil?) || ids.any?(&:negative?)

      ids.uniq
    end

    def assign_master_relations(job)
      if job_params.key?(:position_id)
        job.position = assignable_master_record(job, :positions, :position, job_params[:position_id])
      end

      if job_params.key?(:location_id)
        job.location = assignable_master_record(job, :locations, :location, job_params[:location_id])
      end

      return unless job_params.key?(:tech_stack_ids)

      ids = tech_stack_ids
      if ids.nil?
        raise_invalid_master_relation(job, :tech_stacks, "must be an array of valid IDs")
      end

      tech_stacks = current_user.tech_stacks.where(id: ids)
      if tech_stacks.length != ids.length
        raise_invalid_master_relation(job, :tech_stacks, "must belong to the current user")
      end

      existing_ids = job.persisted? ? job.tech_stack_ids : []
      if tech_stacks.any? { |tech_stack| !tech_stack.active? && !existing_ids.include?(tech_stack.id) }
        raise_invalid_master_relation(job, :tech_stacks, "must be active or already assigned to this job")
      end

      job.tech_stacks = tech_stacks
    end

    def assignable_master_record(job, association, attribute, id)
      record = current_user.public_send(association).find_by(id: id)
      return record if record.nil? || record.active? || record.id == job.public_send("#{attribute}_id")

      raise_invalid_master_relation(job, attribute, "must be active or already assigned to this job")
    end

    def raise_invalid_master_relation(job, attribute, message)
      job.errors.add(attribute, message)
      raise ActiveRecord::RecordInvalid.new(job)
    end

    def url_options
      { host: request.host_with_port, protocol: request.protocol }
    end
  end
end
