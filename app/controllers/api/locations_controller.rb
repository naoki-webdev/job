module Api
  class LocationsController < MasterDataController
    private

    def model_class
      Location
    end

    def resource_name
      :location
    end
  end
end
