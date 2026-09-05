require "digest"
require "securerandom"

class UserSession < ApplicationRecord
  COOKIE_NAME = "job_compare_session"
  EXPIRES_IN = 14.days
  TOKEN_BYTES = 32

  belongs_to :user

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at, presence: true

  class << self
    def issue(user)
      prune_expired!
      raw_token = SecureRandom.urlsafe_base64(TOKEN_BYTES)
      session = create!(
        user: user,
        token_digest: digest(raw_token),
        expires_at: EXPIRES_IN.from_now
      )

      [ session, raw_token ]
    end

    def find_active_by_token(raw_token)
      return if raw_token.blank?

      session = find_by(token_digest: digest(raw_token))
      session if session&.expires_at&.future?
    end

    def digest(raw_token)
      Digest::SHA256.hexdigest(raw_token)
    end

    def prune_expired!
      where("expires_at <= ?", Time.current).delete_all
    end
  end

  def expired?
    expires_at <= Time.current
  end
end
