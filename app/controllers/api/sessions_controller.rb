module Api
  class SessionsController < ApplicationController
    rate_limit to: 10, within: 5.minutes, with: -> { render_rate_limit_error }, only: :create

    skip_before_action :authenticate_user!, only: :create
    skip_before_action :reject_write_request_for_read_only_user, only: [ :create, :destroy ]

    def show
      render json: session_payload
    end

    def create
      user = User.find_by(email: session_params[:email].to_s.strip.downcase)

      if user&.authenticate(session_params[:password])
        _session, token = UserSession.issue(user)
        write_session_cookie(token)
        render json: session_payload(user: user), status: :created
      else
        render_api_error(
          [ I18n.t("api.errors.invalid_login", locale: :ja) ],
          status: :unauthorized,
          code: "INVALID_LOGIN"
        )
      end
    end

    def destroy
      current_user_session&.destroy!
      cookies.delete(UserSession::COOKIE_NAME)
      head :no_content
    end

    private

    def session_payload(user: current_user)
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          read_only: user.read_only?,
          ai_enabled: user.ai_enabled?
        }
      }
    end

    def write_session_cookie(token)
      cookies[UserSession::COOKIE_NAME] = {
        value: token,
        expires: UserSession::EXPIRES_IN.from_now,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax
      }
    end

    def session_params
      params.require(:session).permit(:email, :password)
    end
  end
end
