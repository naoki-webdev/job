module Api
  class EvaluationKeywordsController < ApplicationController
    FIELDS = %w[id pattern label active display_order].freeze

    def index
      render json: scope.ordered.as_json(only: FIELDS)
    end

    def create
      record = scope.new(keyword_params)

      if record.save
        render json: serialize(record), status: :created
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "EVALUATION_KEYWORD_VALIDATION_FAILED"
        )
      end
    end

    def update
      record = scope.find(params[:id])

      if record.update(keyword_params)
        render json: serialize(record)
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "EVALUATION_KEYWORD_VALIDATION_FAILED"
        )
      end
    end

    def destroy
      record = scope.find(params[:id])
      record.destroy!
      head :no_content
    end

    private

    def serialize(record)
      record.as_json(only: FIELDS)
    end

    def keyword_params
      params.require(resource_name).permit(:pattern, :label, :active, :display_order)
    end

    def scope
      raise NotImplementedError
    end

    def resource_name
      raise NotImplementedError
    end
  end
end
