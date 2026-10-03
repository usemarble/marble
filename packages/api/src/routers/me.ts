import { z } from "zod";
import { protectedProcedure } from "../index";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
});

export const meRouter = {
  get: protectedProcedure
    .route({
      method: "GET",
      path: "/me",
      tags: ["Me"],
      summary: "Get the signed-in user",
    })
    .output(userSchema)
    .handler(({ context }) => {
      const { id, name, email, emailVerified, image } = context.session.user;
      return { id, name, email, emailVerified, image: image ?? null };
    }),
};
