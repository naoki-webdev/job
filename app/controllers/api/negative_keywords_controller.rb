module Api
  class NegativeKeywordsController < EvaluationKeywordsController
    private

    def scope
      current_user.negative_keywords
    end

    def resource_name
      :negative_keyword
    end
  end
end
