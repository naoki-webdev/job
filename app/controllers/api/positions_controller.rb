module Api
  class PositionsController < MasterDataController
    private

    def model_class
      Position
    end

    def resource_name
      :position
    end
  end
end
