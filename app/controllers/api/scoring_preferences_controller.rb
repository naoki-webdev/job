module Api
  class ScoringPreferencesController < ApplicationController
    def show
      render json: current_scoring_preference
    end

    def update
      preference = current_scoring_preference

      ScoringPreference.transaction do
        preference.update!(scoring_preference_params)
        record_activity!("scoring_preference.update", preference)
      end
      render json: preference
    rescue ActiveRecord::RecordInvalid => error
      errors = preference.errors.full_messages
      errors = [ error.message ] if errors.empty?
      render_api_error(errors, status: :unprocessable_entity, code: "SCORING_PREFERENCE_VALIDATION_FAILED")
    end

    private

    def scoring_preference_params
      params.require(:scoring_preference).permit(
        :full_remote_weight,
        :hybrid_weight,
        :onsite_weight,
        :high_salary_max_threshold,
        :high_salary_bonus,
        :low_salary_min_threshold,
        :low_salary_penalty
      )
    end

    def current_scoring_preference
      ScoringPreference.current(user: current_user)
    end
  end
end
