class AdminUserProvisioner
  DEFAULT_NAME = "管理者".freeze

  def self.call
    new.call
  end

  def call
    return :skipped unless email.present? && password.present?

    user = User.find_or_initialize_by(email: email)
    user.assign_attributes(
      name: name.presence || user.name.presence || DEFAULT_NAME,
      password: password,
      password_confirmation: password,
      read_only: false,
      ai_enabled: true
    )
    user.save!
    ScoringPreference.current(user: user)

    Rails.logger.info("[AdminUserProvisioner] admin user provisioned: #{user.email}")
    :provisioned
  end

  private

  def email
    ENV["ADMIN_USER_EMAIL"].to_s.strip.downcase
  end

  def password
    ENV["ADMIN_USER_PASSWORD"].to_s
  end

  def name
    ENV["ADMIN_USER_NAME"].to_s.strip
  end
end
