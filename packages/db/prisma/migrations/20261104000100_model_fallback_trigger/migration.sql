ALTER TABLE "space_model_role_choices" ADD COLUMN "fallbackOn" TEXT;
ALTER TABLE "user_model_role_choices" ADD COLUMN "fallbackOn" TEXT;

ALTER TABLE "space_model_role_choices" ADD CONSTRAINT "space_model_role_fallback_trigger"
  CHECK ("fallbackOn" IS NULL OR "fallbackOn" IN ('unavailable', 'rate_limit'));
ALTER TABLE "user_model_role_choices" ADD CONSTRAINT "user_model_role_fallback_trigger"
  CHECK ("fallbackOn" IS NULL OR "fallbackOn" IN ('unavailable', 'rate_limit'));
