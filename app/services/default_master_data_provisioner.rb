class DefaultMasterDataProvisioner
  POSITION_DEFINITIONS = [
    { name: "バックエンドエンジニア", score_weight: 8, display_order: 0, active: true },
    { name: "フロントエンドエンジニア", score_weight: 5, display_order: 1, active: true },
    { name: "フルスタックエンジニア", score_weight: 10, display_order: 2, active: true },
    { name: "テックリード", score_weight: 15, display_order: 3, active: true }
  ].freeze

  TECH_STACK_DEFINITIONS = [
    { name: "Ruby on Rails", score_weight: 20, display_order: 0, active: true },
    { name: "TypeScript", score_weight: 15, display_order: 1, active: true },
    { name: "React", score_weight: 8, display_order: 2, active: true },
    { name: "Go", score_weight: 6, display_order: 3, active: true },
    { name: "Vue.js", score_weight: 5, display_order: 4, active: true },
    { name: "Spring Boot", score_weight: 4, display_order: 5, active: true },
    { name: "Python", score_weight: 4, display_order: 6, active: true },
    { name: "Django", score_weight: 4, display_order: 7, active: true }
  ].freeze

  LOCATION_DEFINITIONS = [
    { name: "東京", score_weight: 6, display_order: 0, active: true },
    { name: "大阪", score_weight: 4, display_order: 1, active: true },
    { name: "福岡", score_weight: 3, display_order: 2, active: true },
    { name: "名古屋", score_weight: 2, display_order: 3, active: true },
    { name: "リモート", score_weight: 12, display_order: 4, active: true }
  ].freeze

  POSITIVE_KEYWORD_DEFINITIONS = [
    { pattern: "フルリモート", label: "リモート前提で働ける", display_order: 0, active: true },
    { pattern: "React", label: "React を使う開発", display_order: 1, active: true },
    { pattern: "TypeScript", label: "TypeScript を使う開発", display_order: 2, active: true },
    { pattern: "自社サービス", label: "自社サービス開発", display_order: 3, active: true }
  ].freeze

  NEGATIVE_KEYWORD_DEFINITIONS = [
    { pattern: "業務範囲", label: "業務範囲を確認", display_order: 0, active: true },
    { pattern: "チーム体制", label: "チーム体制を確認", display_order: 1, active: true },
    { pattern: "評価制度", label: "評価制度を確認", display_order: 2, active: true }
  ].freeze

  INTERVIEW_QUESTION_DEFINITIONS = [
    { body: "チーム体制と役割分担", display_order: 0, active: true },
    { body: "オンボーディングの流れ", display_order: 1, active: true },
    { body: "評価制度と期待値", display_order: 2, active: true }
  ].freeze

  def self.call(user:, update_existing: false)
    new(user, update_existing:).call
  end

  def initialize(user, update_existing:)
    @user = user
    @update_existing = update_existing
  end

  def call
    ActiveRecord::Base.transaction do
      locations = persist(@user.locations, LOCATION_DEFINITIONS, :name)
      positions = persist(@user.positions, POSITION_DEFINITIONS, :name)
      tech_stacks = persist(@user.tech_stacks, TECH_STACK_DEFINITIONS, :name)
      persist(@user.positive_keywords, POSITIVE_KEYWORD_DEFINITIONS, :pattern)
      persist(@user.negative_keywords, NEGATIVE_KEYWORD_DEFINITIONS, :pattern)
      persist(@user.interview_questions, INTERVIEW_QUESTION_DEFINITIONS, :body)

      {
        locations:,
        positions:,
        tech_stacks: tech_stacks.index_by(&:name)
      }
    end
  end

  private

  def persist(scope, definitions, unique_key)
    definitions.map do |attributes|
      record = scope.find_or_initialize_by(unique_key => attributes.fetch(unique_key))
      next record if record.persisted? && !@update_existing

      record.assign_attributes(attributes)
      record.save!
      record
    end
  end
end
