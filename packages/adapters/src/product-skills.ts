import { PRODUCT_SKILLS } from "./product-skills.generated.js";

export function productSkill(name: string) {
  return PRODUCT_SKILLS.find((entry) => entry.name === name);
}

/** Runtime lookup uses immutable embedded bytes, never a model-supplied filesystem path. */
export function productSkillResource(name: string, resource: string) {
  if (
    resource.includes("\\") ||
    !/^[a-zA-Z0-9_./-]+$/.test(resource) ||
    resource.split("/").some((segment) => !segment || segment === "." || segment === "..")
  )
    return undefined;
  const skill = productSkill(name);
  if (!skill || !Object.hasOwn(skill.resources, resource)) return undefined;
  return skill.resources[resource];
}
