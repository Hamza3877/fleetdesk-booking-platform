import { getRepository } from "@/server/db";
import type { BusinessSettings } from "@/types";

export function getSettings(): Promise<BusinessSettings> {
  return getRepository().settings.get();
}

export function updateSettings(settings: BusinessSettings): Promise<BusinessSettings> {
  return getRepository().settings.save(settings);
}
