ActiveRecord::Base.transaction do
work_styles = %w[full_remote hybrid onsite]
employment_types = %w[full_time contract]
companies = Array.new(40) { |i| "サンプル会社 #{i + 1}" }
demo_email = Rails.application.config.x.demo_account.email
demo_password = Rails.application.config.x.demo_account.password

if Rails.env.production? && ENV["DEMO_USER_PASSWORD"].blank?
  raise "DEMO_USER_PASSWORD must be set before seeding production"
end

job_stack_sets = [
  [ "Ruby on Rails", "TypeScript", "React" ],
  [ "Go", "React", "TypeScript" ],
  [ "Ruby on Rails", "Vue.js" ],
  [ "Spring Boot", "React" ],
  [ "Python", "Django", "TypeScript" ]
]

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
  [ owner, DefaultMasterDataProvisioner.call(user: owner, update_existing: true) ]
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
