class Location < ApplicationRecord
  include MasterDataRecord

  belongs_to :user
  has_many :jobs, dependent: :restrict_with_error
end
