import { useSiteSettings } from "@/hooks/useSiteSettings";

export function AuthBackground() {
  const { auth_bg_color, auth_bg_image_url } = useSiteSettings();
  return (
    <>
      <div className="absolute inset-0" style={{ backgroundColor: auth_bg_color || "#1a0a0f" }} />
      {auth_bg_image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${auth_bg_image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,38,53,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.15),transparent_50%)]" />
      )}
      {auth_bg_image_url && <div className="absolute inset-0 bg-black/40" />}
    </>
  );
}
