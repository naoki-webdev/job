require "test_helper"

module JobDrafts
  class RuleBasedParserTest < ActiveSupport::TestCase
    setup do
      JobTechStack.delete_all
      Job.delete_all
      Location.delete_all
      Position.delete_all
      TechStack.delete_all
      ScoringPreference.delete_all
      PositiveKeyword.delete_all
      NegativeKeyword.delete_all
      InterviewQuestion.delete_all
      ActivityLog.delete_all
      User.delete_all

      @user = create_user(email: "parser@example.com")
      @tokyo = Location.create!(user: @user, name: "東京", score_weight: 6, active: true, display_order: 0)
      @remote_location = Location.create!(user: @user, name: "リモート", score_weight: 12, active: true, display_order: 1)
      @react = TechStack.create!(user: @user, name: "React", score_weight: 8, active: true, display_order: 0)
      @ts = TechStack.create!(user: @user, name: "TypeScript", score_weight: 15, active: true, display_order: 1)
      @go = TechStack.create!(user: @user, name: "Go", score_weight: 6, active: true, display_order: 2)

      @masters = masters_for(@user)
    end

    test "extracts company name, salary, tech stacks and user-owned insights" do
      @user.positive_keywords.create!(pattern: "React", label: "React を使う開発", active: true, display_order: 0)
      @user.negative_keywords.create!(pattern: "業務範囲", label: "業務範囲を確認", active: true, display_order: 0)
      @user.interview_questions.create!(body: "チーム体制と役割分担", active: true, display_order: 0)

      text = <<~TEXT
        株式会社サンプル
        職種: フロントエンドエンジニア
        年収: 700万〜900万
        勤務地: 東京（フルリモート可）
        必須スキル: React, TypeScript
        業務範囲の確認が必要です。
      TEXT

      result = JobDrafts::RuleBasedParser.new(text: text, url: "https://example.com/job/1", masters: masters_for(@user)).call

      assert_match(/サンプル/, result["company_name"])
      assert_equal 7_000_000, result["salary_min_jpy"]
      assert_equal 9_000_000, result["salary_max_jpy"]
      assert_equal "full_remote", result["work_style"]
      assert_includes result["tech_stacks"], "React"
      assert_includes result["tech_stacks"], "TypeScript"
      assert_equal "東京", result["location"]
      assert_includes result["pros"], "React を使う開発"
      assert_includes result["cons"], "業務範囲を確認"
      assert_equal [ "チーム体制と役割分担" ], result["questions"]
      assert_kind_of Integer, result["score_estimate"]
    end

    test "returns nil work_style when no keywords match" do
      result = JobDrafts::RuleBasedParser.new(text: "普通の求人です", url: "", masters: @masters).call

      assert_nil result["work_style"]
      assert_nil result["location"]
    end

    test "does not treat plain years as salary values" do
      result = JobDrafts::RuleBasedParser.new(
        text: "2026年4月入社。勤務地は東京です。",
        url: "",
        masters: @masters
      ).call

      assert_nil result["salary_min_jpy"]
      assert_nil result["salary_max_jpy"]
    end

    test "extracts hybrid and onsite work styles from common wording" do
      hybrid = JobDrafts::RuleBasedParser.new(text: "週2日出社、リモート併用です", url: "", masters: @masters).call
      onsite = JobDrafts::RuleBasedParser.new(text: "原則出社勤務・客先常駐の案件です", url: "", masters: @masters).call

      assert_equal "hybrid", hybrid["work_style"]
      assert_equal "onsite", onsite["work_style"]
    end

    test "does not match short technology names inside longer names" do
      django = TechStack.create!(user: @user, name: "Django", score_weight: 4, active: true, display_order: 3)
      r_language = TechStack.create!(user: @user, name: "R", score_weight: 3, active: true, display_order: 4)
      c_language = TechStack.create!(user: @user, name: "C", score_weight: 2, active: true, display_order: 5)
      masters = @masters.merge(tech_stacks: [ @go, @react, django, r_language, c_language ])

      result = JobDrafts::RuleBasedParser.new(
        text: "Django、Google Cloud、CSS、Reactを使う求人です。",
        url: "",
        masters: masters
      ).call

      assert_includes result["tech_stacks"], "Django"
      assert_includes result["tech_stacks"], "React"
      assert_not_includes result["tech_stacks"], "Go"
      assert_not_includes result["tech_stacks"], "R"
      assert_not_includes result["tech_stacks"], "C"
    end

    test "returns empty insights when the user has no evaluation masters" do
      result = JobDrafts::RuleBasedParser.new(text: "本文", url: "", masters: @masters).call

      assert_empty result["pros"]
      assert_empty result["cons"]
      assert_empty result["questions"]
      assert_nil result["score_estimate"]
    end

    test "matches evaluation keyword patterns without case sensitivity" do
      @user.positive_keywords.create!(pattern: "React", label: "React を使う開発", active: true, display_order: 0)

      result = JobDrafts::RuleBasedParser.new(
        text: "react を使う求人です",
        url: "",
        masters: masters_for(@user)
      ).call

      assert_includes result["pros"], "React を使う開発"
    end

    test "does not use another user's evaluation masters" do
      other_user = create_user(email: "other-parser@example.com")
      other_user.positive_keywords.create!(pattern: "React", label: "別ユーザーのReact評価", active: true, display_order: 0)
      other_user.negative_keywords.create!(pattern: "業務範囲", label: "別ユーザーの業務範囲評価", active: true, display_order: 0)
      other_user.interview_questions.create!(body: "別ユーザーの質問", active: true, display_order: 0)

      result = JobDrafts::RuleBasedParser.new(text: "React 業務範囲", url: "", masters: masters_for(@user)).call

      assert_empty result["pros"]
      assert_empty result["cons"]
      assert_empty result["questions"]
    end

    test "builder calculates score estimate from whitelisted insights" do
      @user.positive_keywords.create!(pattern: "React", label: "React を使う開発", active: true, display_order: 0)
      @user.negative_keywords.create!(pattern: "業務範囲", label: "業務範囲を確認", active: true, display_order: 0)
      @user.interview_questions.create!(body: "チーム体制と役割分担", active: true, display_order: 0)

      insights = JobDrafts::Builder.new(user: @user, text: "", url: "", mode: "rule").send(
        :build_insights,
        {
          "score_estimate" => 99,
          "pros" => [ "React を使う開発", "未登録のメリット" ],
          "cons" => [ "業務範囲を確認", "未登録のデメリット" ],
          "questions" => [ "チーム体制と役割分担", "未登録の質問" ]
        }
      )

      assert_equal 49, insights[:score_estimate]
      assert_equal [ "React を使う開発" ], insights[:pros]
      assert_equal [ "業務範囲を確認" ], insights[:cons]
      assert_equal [ "チーム体制と役割分担" ], insights[:questions]
    end

    test "builder does not expose another user's structural masters" do
      other_user = create_user(email: "other-structural-parser@example.com")
      other_location = other_user.locations.create!(name: "大阪", score_weight: 4, active: true, display_order: 0)
      other_stack = other_user.tech_stacks.create!(name: "Vue.js", score_weight: 5, active: true, display_order: 0)

      draft = JobDrafts::Builder.new(user: @user, text: "", url: "", mode: "rule").send(
        :build_draft,
        { "tech_stacks" => [ other_stack.name ], "location" => other_location.name }
      )

      assert_empty draft[:tech_stack_ids]
      assert_nil draft[:location_id]
    end

    test "builder only matches exact structural masters and explicit aliases" do
      django = TechStack.create!(user: @user, name: "Django", score_weight: 4, active: true, display_order: 3)
      rails = TechStack.create!(user: @user, name: "Ruby on Rails", score_weight: 20, active: true, display_order: 4)

      draft = JobDrafts::Builder.new(user: @user, text: "", url: "", mode: "rule").send(
        :build_draft,
        { "tech_stacks" => [ "Django", "Google Cloud", "Rails", "React" ] }
      )

      assert_equal [ django.id, rails.id, @react.id ], draft[:tech_stack_ids]
      assert_equal [ "Django", "Ruby on Rails", "React" ], draft[:tech_stack_names]
    end

    test "builder only accepts ai responses with useful draft fields" do
      builder = JobDrafts::Builder.new(user: @user, text: "", url: "", mode: "rule")

      assert_not builder.send(:useful_ai_response?, {})
      assert_not builder.send(:useful_ai_response?, { "pros" => [ "登録済みの評価" ] })
      assert builder.send(:useful_ai_response?, { "company_name" => "サンプル会社" })
      assert builder.send(:useful_ai_response?, { "tech_stacks" => [ "React" ] })
    end

    test "normalizes useful ai draft fields before exposing them" do
      builder = JobDrafts::Builder.new(user: @user, text: "", url: "", mode: "rule")

      draft = builder.send(
        :build_draft,
        {
          "company_name" => { "unexpected" => true },
          "salary_min_jpy" => "7000000",
          "salary_max_jpy" => 9_000_000.5,
          "work_style" => "unknown",
          "tech_stacks" => [ "react", 123 ],
          "location" => "東京"
        }
      )

      assert_nil draft[:company_name]
      assert_equal 7_000_000, draft[:salary_min]
      assert_nil draft[:salary_max]
      assert_nil draft[:work_style]
      assert_equal [ @react.id ], draft[:tech_stack_ids]
      assert_equal @tokyo.id, draft[:location_id]
    end

    private

    def masters_for(user)
      {
        tech_stacks: user.tech_stacks.ordered.to_a,
        locations: user.locations.ordered.to_a,
        positive_keywords: user.positive_keywords.active.ordered.to_a,
        negative_keywords: user.negative_keywords.active.ordered.to_a,
        interview_questions: user.interview_questions.active.ordered.to_a
      }
    end
  end
end
