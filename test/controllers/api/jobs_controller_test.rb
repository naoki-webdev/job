require "test_helper"

module Api
  class JobsControllerTest < ActiveSupport::TestCase
    test "reports a storage purge failure to the caller" do
      attachment = Object.new
      attachment.define_singleton_method(:purge) { raise "storage unavailable" }
      job = Struct.new(:id, :company_logo).new(42, attachment)

      assert_not JobsController.new.send(:purge_company_logo, job)
    end
  end
end
