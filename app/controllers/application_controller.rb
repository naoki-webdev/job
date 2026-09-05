class ApplicationController < ActionController::API
  include ActionController::Cookies

  SAFE_REQUEST_METHODS = %w[GET HEAD OPTIONS].freeze

  rescue_from StandardError, with: :render_internal_server_error
  rescue_from ActionController::ParameterMissing, with: :render_invalid_request
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  before_action :authenticate_user!
  before_action :reject_write_request_for_read_only_user
  before_action :reject_cross_origin_write_request
  around_action :log_api_request

  private

  attr_reader :current_user, :current_user_session

  def authenticate_user!
    session = user_session_from_cookie
    if session
      @current_user_session = session
      @current_user = session.user
      Current.user_id = @current_user.id
      return @current_user
    end

    render_api_error(
      [ I18n.t("api.errors.unauthorized", locale: :ja) ],
      status: :unauthorized,
      code: "UNAUTHORIZED"
    )
  end

  def user_session_from_cookie
    token = cookies[UserSession::COOKIE_NAME]
    session = UserSession.find_active_by_token(token)
    cookies.delete(UserSession::COOKIE_NAME) if token.present? && session.nil?
    session
  end

  def record_activity!(action, record, metadata: {})
    current_user.activity_logs.create!(
      action: action,
      resource_type: record.class.name,
      resource_id: record.id,
      metadata: metadata
    )
  end

  def reject_write_request_for_read_only_user
    return if SAFE_REQUEST_METHODS.include?(request.request_method)
    return unless current_user
    return unless current_user.read_only? || protected_demo_email?

    render_api_error(
      [ I18n.t("api.errors.read_only_demo", locale: :ja) ],
      status: :forbidden,
      code: "READ_ONLY_DEMO"
    )
  end

  def reject_cross_origin_write_request
    return if SAFE_REQUEST_METHODS.include?(request.request_method)

    origin = request.headers["Origin"].to_s.chomp("/")
    return if origin.blank? || allowed_request_origins.include?(origin)

    render_api_error(
      [ I18n.t("api.errors.invalid_origin", locale: :ja) ],
      status: :forbidden,
      code: "INVALID_ORIGIN"
    )
  end

  def allowed_request_origins
    @allowed_request_origins ||= [
      request.base_url,
      Rails.application.config.x.frontend_origins
    ].flatten.map { |value| value.to_s.strip.chomp("/") }.reject(&:blank?).uniq
  end

  def protected_demo_email?
    current_user.email == Rails.application.config.x.demo_account.email
  end

  def render_api_error(errors, status:, code:)
    render json: {
      code: code,
      errors: Array(errors),
      request_id: request.request_id
    }, status: status
  end

  def render_invalid_request(_error)
    render_api_error(
      [ I18n.t("api.errors.invalid_request", locale: :ja) ],
      status: :bad_request,
      code: "INVALID_REQUEST"
    )
  end

  def render_not_found(_error)
    render_api_error(
      [ I18n.t("api.errors.not_found", locale: :ja) ],
      status: :not_found,
      code: "NOT_FOUND"
    )
  end

  def render_rate_limit_error
    render_api_error(
      [ I18n.t("api.errors.too_many_requests", locale: :ja) ],
      status: :too_many_requests,
      code: "RATE_LIMITED"
    )
  end

  def render_internal_server_error(error)
    Rails.logger.error(
      {
        event: "api_error",
        request_id: request.request_id,
        user_id: current_user&.id,
        error_class: error.class.name
      }.to_json
    )

    render_api_error(
      [ I18n.t("api.errors.internal_server_error", locale: :ja) ],
      status: :internal_server_error,
      code: "INTERNAL_SERVER_ERROR"
    )
  end

  def log_api_request
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Current.set(request_id: request.request_id, user_id: nil, db_duration_ms: 0.0) do
      yield
    ensure
      Current.user_id = current_user&.id
      Rails.logger.info(
        {
          event: "api_request",
          request_id: request.request_id,
          user_id: current_user&.id,
          route: "#{request.path_parameters[:controller]}##{request.path_parameters[:action]}",
          status: response.status,
          duration_ms: elapsed_milliseconds(started_at),
          db_duration_ms: Current.db_duration_ms.round(1)
        }.to_json
      )
    end
  end

  def elapsed_milliseconds(started_at)
    ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1_000).round(1)
  end
end
