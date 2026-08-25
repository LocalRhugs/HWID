export const ALLOWED_EMAILS = [
  "combophantom@gmail.com",
  "killerkanhai861@gmail.com",
  "dylanfoc@proton.me",
];

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}