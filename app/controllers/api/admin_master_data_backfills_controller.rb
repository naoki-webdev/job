module Api
  class AdminMasterDataBackfillsController < ApplicationController
    before_action :require_configured_admin!

    def create
      completed = current_user.with_lock do
        next false if current_user.default_master_data_initialized_at.present?

        DefaultMasterDataProvisioner.call(user: current_user)
        current_user.update!(default_master_data_initialized_at: Time.current)
        true
      end

      unless completed
        return render_api_error(
          [ "初期マスターの補完はすでに実行済みです。" ],
          status: :conflict,
          code: "MASTER_DATA_ALREADY_INITIALIZED"
        )
      end

      render json: { completed: true }
    end

    private

    def require_configured_admin!
      admin_email = ENV["ADMIN_USER_EMAIL"].to_s.strip.downcase
      return if admin_email.present? && current_user.email == admin_email

      render_api_error(
        [ "管理者のみ実行できます。" ],
        status: :forbidden,
        code: "ADMIN_ONLY"
      )
    end
  end
end
