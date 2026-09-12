-- Store the latest Polar webhook timestamp applied to a subscription so stale
-- webhook deliveries cannot overwrite newer subscription state.
ALTER TABLE "subscription" ADD COLUMN "lastPolarEventAt" TIMESTAMP(3);
