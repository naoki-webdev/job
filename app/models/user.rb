class User < ApplicationRecord
  has_secure_password

  has_many :jobs, dependent: :destroy
  has_many :positions, dependent: :destroy
  has_many :locations, dependent: :destroy
  has_many :tech_stacks, dependent: :destroy
  has_many :activity_logs, dependent: :destroy
  has_many :user_sessions, dependent: :destroy
  has_many :positive_keywords, dependent: :destroy
  has_many :negative_keywords, dependent: :destroy
  has_many :interview_questions, dependent: :destroy
  has_one :scoring_preference, dependent: :destroy

  normalizes :email, with: ->(email) { email.to_s.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false }
end
