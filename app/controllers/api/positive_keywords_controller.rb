module Api
  class PositiveKeywordsController < EvaluationKeywordsController
    private

    def scope
      current_user.positive_keywords
    end

    def resource_name
      :positive_keyword
    end
  end
end
