Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resource :session, only: [ :show, :create, :destroy ]
    get "jobs/export", to: "jobs#export"
    resources :job_drafts, only: [ :create ]
    resource :scoring_preference, only: [ :show, :update ]
    resources :locations, only: [ :index, :create, :update, :destroy ]
    resources :positions, only: [ :index, :create, :update, :destroy ]
    resources :tech_stacks, only: [ :index, :create, :update, :destroy ]
    resources :positive_keywords, only: [ :index, :create, :update, :destroy ]
    resources :negative_keywords, only: [ :index, :create, :update, :destroy ]
    resources :interview_questions, only: [ :index, :create, :update, :destroy ]
    resources :jobs, only: [ :index, :show, :create, :update, :destroy ]
  end

  root "frontend#index"
  get "*path", to: "frontend#index", constraints: lambda { |request|
    request.format.html? && !request.path.start_with?("/api")
  }
end
