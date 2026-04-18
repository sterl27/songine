import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel("songine-frontend");
}
