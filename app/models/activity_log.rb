class ActivityLog < ApplicationRecord
  belongs_to :user

  validates :action, presence: true
  validates :resource_type, presence: true
end
