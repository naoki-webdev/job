module Api
  class MasterDataController < ApplicationController
    FIELDS = %w[id name score_weight active display_order].freeze

    def index
      render json: scope.ordered.as_json(only: FIELDS)
    end

    def create
      record = scope.new(master_data_params)

      if record.save
        render json: serialize(record), status: :created
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "MASTER_DATA_VALIDATION_FAILED"
        )
      end
    end

    def update
      record = scope.find(params[:id])

      if record.update(master_data_params)
        render json: serialize(record)
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "MASTER_DATA_VALIDATION_FAILED"
        )
      end
    end

    def destroy
      record = scope.find(params[:id])

      if record.jobs.exists?
        record.update!(active: false)
        render json: serialize(record)
      else
        record.destroy!
        head :no_content
      end
    end

    private

    def serialize(record)
      record.as_json(only: FIELDS)
    end

    def master_data_params
      params.require(resource_name).permit(:name, :score_weight, :active, :display_order)
    end

    def model_class
      raise NotImplementedError
    end

    def scope
      current_user.public_send(model_class.table_name)
    end

    def resource_name
      raise NotImplementedError
    end
  end
end
