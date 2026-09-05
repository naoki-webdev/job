ActiveRecord::Base.transaction do
work_styles = %w[full_remote hybrid onsite]
employment_types = %w[full_time contract]
companies = Array.new(40) { |i| "サンプル会社 #{i + 1}" }
demo_email = Rails.application.config.x.demo_account.email
demo_password = Rails.application.config.x.demo_account.password

if Rails.env.production? && ENV["DEMO_USER_PASSWORD"].blank?
  raise "DEMO_USER_PASSWORD must be set before seeding production"
end

position_definitions = [
  { name: "バックエンドエンジニア", score_weight: 8, display_order: 0 },
  { name: "フロントエンドエンジニア", score_weight: 5, display_order: 1 },
  { name: "フルスタックエンジニア", score_weight: 10, display_order: 2 },
  { name: "テックリード", score_weight: 15, display_order: 3 }
]

tech_stack_definitions = [
  { name: "Ruby on Rails", score_weight: 20, display_order: 0 },
  { name: "TypeScript", score_weight: 15, display_order: 1 },
  { name: "React", score_weight: 8, display_order: 2 },
  { name: "Go", score_weight: 6, display_order: 3 },
  { name: "Vue.js", score_weight: 5, display_order: 4 },
  { name: "Spring Boot", score_weight: 4, display_order: 5 },
  { name: "Python", score_weight: 4, display_order: 6 },
  { name: "Django", score_weight: 4, display_order: 7 }
]

location_definitions = [
  { name: "東京", score_weight: 6, display_order: 0 },
  { name: "大阪", score_weight: 4, display_order: 1 },
  { name: "福岡", score_weight: 3, display_order: 2 },
  { name: "名古屋", score_weight: 2, display_order: 3 },
  { name: "リモート", score_weight: 12, display_order: 4 }
]

job_stack_sets = [
  [ "Ruby on Rails", "TypeScript", "React" ],
  [ "Go", "React", "TypeScript" ],
  [ "Ruby on Rails", "Vue.js" ],
  [ "Spring Boot", "React" ],
  [ "Python", "Django", "TypeScript" ]
]

upsert = lambda do |scope, attributes, key|
  record = scope.find_or_initialize_by(key => attributes.fetch(key))
  record.assign_attributes(attributes)
  record.save!
  record
end

demo_user = User.find_or_initialize_by(email: demo_email)
demo_user.assign_attributes(
  name: "デモユーザー",
  password: demo_password,
  password_confirmation: demo_password,
  read_only: true,
  ai_enabled: false
)
demo_user.save!

# 通常ユーザー: E2E / 開発用。public な credentials なので本番 (production) には絶対に作らない。
# 本番デモは demo user (read_only=true) のみ存在し、書き込みは API 層で 403。
e2e_user =
  if Rails.env.development? || Rails.env.test?
    user = User.find_or_initialize_by(email: "e2e@example.com")
    user.assign_attributes(
      name: "テストユーザー",
      password: "password",
      password_confirmation: "password",
      read_only: false,
      ai_enabled: false
    )
    user.save!
    ScoringPreference.current(user: user)
    user
  end

masters_by_user = [ demo_user, e2e_user ].compact.to_h do |owner|
  locations = location_definitions.map do |attributes|
    upsert.call(owner.locations, attributes.merge(active: true), :name)
  end

  positions = position_definitions.map do |attributes|
    upsert.call(owner.positions, attributes.merge(active: true), :name)
  end

  tech_stacks = tech_stack_definitions.map do |attributes|
    upsert.call(owner.tech_stacks, attributes.merge(active: true), :name)
  end.index_by(&:name)

  [ owner, { locations: locations, positions: positions, tech_stacks: tech_stacks } ]
end

ScoringPreference.current(user: demo_user).update!(
  full_remote_weight: 30,
  hybrid_weight: 15,
  onsite_weight: 0,
  high_salary_max_threshold: 8_000_000,
  high_salary_bonus: 10,
  low_salary_min_threshold: 4_000_000,
  low_salary_penalty: -10
)

[ demo_user, e2e_user ].compact.each do |owner|
  masters = masters_by_user.fetch(owner)

  [
    { pattern: "フルリモート", label: "リモート前提で働ける", display_order: 0 },
    { pattern: "React", label: "React を使う開発", display_order: 1 },
    { pattern: "TypeScript", label: "TypeScript を使う開発", display_order: 2 },
    { pattern: "自社サービス", label: "自社サービス開発", display_order: 3 }
  ].each do |attributes|
    upsert.call(owner.positive_keywords, attributes.merge(active: true), :pattern)
  end

  [
    { pattern: "業務範囲", label: "業務範囲を確認", display_order: 0 },
    { pattern: "チーム体制", label: "チーム体制を確認", display_order: 1 },
    { pattern: "評価制度", label: "評価制度を確認", display_order: 2 }
  ].each do |attributes|
    upsert.call(owner.negative_keywords, attributes.merge(active: true), :pattern)
  end

  [
    { body: "チーム体制と役割分担", display_order: 0 },
    { body: "オンボーディングの流れ", display_order: 1 },
    { body: "評価制度と期待値", display_order: 2 }
  ].each do |attributes|
    upsert.call(owner.interview_questions, attributes.merge(active: true), :body)
  end

  40.times do |i|
    salary_min = 4_500_000 + (i % 8) * 400_000
    salary_max = salary_min + 1_500_000 + (i % 5) * 300_000
    stack_names = job_stack_sets[i % job_stack_sets.length]
    status = case i % 10
    when 0, 1, 2, 3
      "interested"
    when 4, 5, 6
      "applied"
    when 7, 8
      "interviewing"
    when 9
      i.even? ? "offer" : "rejected"
    end

    job = owner.jobs.find_or_initialize_by(company_name: companies[i])
    job.assign_attributes(
      company_name: companies[i],
      position: masters[:positions][i % masters[:positions].length],
      status: status,
      work_style: work_styles[i % work_styles.length],
      employment_type: employment_types[i % employment_types.length],
      salary_min: salary_min,
      salary_max: salary_max,
      location: masters[:locations][i % masters[:locations].length],
      notes: "選考メモ #{i + 1}: カジュアル面談・面接メモをここに記録。",
      created_at: Time.current - i.days,
      updated_at: Time.current - i.hours
    )
    job.tech_stacks = stack_names.map { |name| masters[:tech_stacks].fetch(name) }
    job.save!
  end
end
end
