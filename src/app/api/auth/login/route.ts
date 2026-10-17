import { loginSchema } from "@/lib/schemas";
import { checkCredentials, setSessionCookie } from "@/server/auth";
import { UnauthorizedError } from "@/server/errors";
import { json, readJson, route } from "@/server/http";

export const POST = route(async (request: Request) => {
  const { email, password } = loginSchema.parse(await readJson(request));
  if (!checkCredentials(email, password)) throw new UnauthorizedError("Wrong email or password");

  await setSessionCookie(email);
  return json({ ok: true });
});
