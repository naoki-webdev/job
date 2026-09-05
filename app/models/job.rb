class Job < ApplicationRecord
  ALLOWED_LOGO_CONTENT_TYPES = %w[image/gif image/jpeg image/png image/svg+xml image/webp].freeze

  belongs_to :user
  belongs_to :position
  belongs_to :location
  has_many :job_tech_stacks, dependent: :destroy
  has_many :tech_stacks, -> { ordered }, through: :job_tech_stacks
  has_one_attached :company_logo

  enum :status, {
    interested: "interested",
    applied: "applied",
    interviewing: "interviewing",
    offer: "offer",
    rejected: "rejected"
  }, validate: true

  enum :work_style, {
    full_remote: "full_remote",
    hybrid: "hybrid",
    onsite: "onsite"
  }, validate: true

  enum :employment_type, {
    full_time: "full_time",
    contract: "contract"
  }, validate: true

  validates :company_name, presence: true
  validates :position, presence: true
  validates :status, presence: true
  validates :work_style, presence: true
  validates :employment_type, presence: true
  validates :salary_min, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :salary_max, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :salary_max, numericality: { greater_than_or_equal_to: :salary_min }
  validates :tech_stacks, presence: true
  validates :location, presence: true
  validates :source_url, length: { maximum: 2048 }, format: { with: %r{\Ahttps?://.+\z}i, allow_blank: true }
  validate :company_logo_must_be_image
  validate :company_logo_must_be_small_enough
  validate :master_records_belong_to_user

  before_save :set_score

  delegate :name, to: :position, prefix: true, allow_nil: true
  delegate :name, to: :location, prefix: true, allow_nil: true

  def tech_stack_names
    tech_stacks.map(&:name).join(", ")
  end

  private

  def company_logo_must_be_image
    return unless company_logo.attached?
    return if ALLOWED_LOGO_CONTENT_TYPES.include?(company_logo.blob.content_type.to_s)

    errors.add(:company_logo, "must be an image")
  end

  def company_logo_must_be_small_enough
    return unless company_logo.attached?
    return if company_logo.blob.byte_size <= 5.megabytes

    errors.add(:company_logo, "must be 5MB or smaller")
  end

  def master_records_belong_to_user
    return if user.blank?

    errors.add(:position, "must belong to the same user") if position.present? && position.user_id != user_id
    errors.add(:location, "must belong to the same user") if location.present? && location.user_id != user_id

    foreign_tech_stack = tech_stacks.any? { |tech_stack| tech_stack.user_id != user_id }
    errors.add(:tech_stacks, "must belong to the same user") if foreign_tech_stack
  end

  def set_score
    self.score = JobScoreCalculator.call(self)
  end
end
