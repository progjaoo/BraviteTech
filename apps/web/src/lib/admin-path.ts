/** Recognizes the opaque panel route shape without exposing its configured value. */
export function isPrivateAdminPath(pathname: string): boolean {
  return /^\/[a-f0-9]{64}\/?$/.test(pathname);
}
