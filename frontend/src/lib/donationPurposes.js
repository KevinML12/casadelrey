import { useApiResource } from "./feed";

export function useDonationPurposeResource() {
  const resource = useApiResource("/donation-purposes");
  return {
    ...resource,
    purposes: Array.isArray(resource.data)
      ? resource.data.filter((item) => item.is_active !== false)
      : [],
  };
}
export function useDonationPurposes() {
  return useDonationPurposeResource().purposes;
}
