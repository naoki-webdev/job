module Api
  class InterviewQuestionsController < ApplicationController
    FIELDS = %w[id body active display_order].freeze

    def index
      render json: current_user.interview_questions.ordered.as_json(only: FIELDS)
    end

    def create
      record = current_user.interview_questions.new(question_params)

      if record.save
        render json: serialize(record), status: :created
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "INTERVIEW_QUESTION_VALIDATION_FAILED"
        )
      end
    end

    def update
      record = current_user.interview_questions.find(params[:id])

      if record.update(question_params)
        render json: serialize(record)
      else
        render_api_error(
          record.errors.full_messages,
          status: :unprocessable_entity,
          code: "INTERVIEW_QUESTION_VALIDATION_FAILED"
        )
      end
    end

    def destroy
      record = current_user.interview_questions.find(params[:id])
      record.destroy!
      head :no_content
    end

    private

    def serialize(record)
      record.as_json(only: FIELDS)
    end

    def question_params
      params.require(:interview_question).permit(:body, :active, :display_order)
    end
  end
end
