module Api
  class TechStacksController < MasterDataController
    private

    def model_class
      TechStack
    end

    def resource_name
      :tech_stack
    end
  end
end
