module Api
  class JobDraftsController < ApplicationController
    MAX_TEXT_LENGTH = 8_000

    rate_limit to: 20, within: 5.minutes,
      by: -> { current_user ? "user:#{current_user.id}" : "ip:#{request.remote_ip}" },
      with: -> { render_rate_limit_error },
      only: :create

    def create
      text = draft_params[:text].to_s

      if text.strip.empty?
        return render_api_error(
          [ I18n.t("api.errors.job_draft.text_required", locale: :ja) ],
          status: :unprocessable_entity,
          code: "JOB_DRAFT_TEXT_REQUIRED"
        )
      end

      if text.length > MAX_TEXT_LENGTH
        return render_api_error(
          [ I18n.t("api.errors.job_draft.text_too_long", limit: MAX_TEXT_LENGTH, locale: :ja) ],
          status: :unprocessable_entity,
          code: "JOB_DRAFT_TEXT_TOO_LONG"
        )
      end

      result = JobDrafts::Builder.new(
        user: current_user,
        text: text,
        url: draft_params[:url],
        mode: effective_mode
      ).call

      render json: result
    end

    private

    def draft_params
      params.require(:job_draft).permit(:text, :url, :mode)
    end

    def effective_mode
      requested = draft_params[:mode]
      return requested if current_user.ai_enabled?

      "rule"
    end
  end
end
