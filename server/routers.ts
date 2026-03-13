import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  LABEL_COLORS,
  LABEL_MATERIALS,
  LABEL_SIZES,
  WEAVE_TYPES,
  type LabelConfig,
} from "./label";
import { TEXTURE_TYPES } from "./texturePresets";

const labelConfigInputSchema = z.object({
  material: z.enum(LABEL_MATERIALS).optional(),
  color: z.enum(LABEL_COLORS).optional(),
  size: z.enum(LABEL_SIZES).optional(),
  weaveType: z.enum(WEAVE_TYPES).optional(),
  gridDensity: z.number().positive().optional(),
  threadAngle: z.number().finite().optional(),
  glossLevel: z.enum(["low", "medium", "high"]).optional(),
});

export const labelGenerateInputSchema = z
  .object({
    logoDataUrl: z.string().regex(/^data:image\/[a-zA-Z0-9+.-]+;base64,/),
    textureType: z.enum(TEXTURE_TYPES).optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    config: labelConfigInputSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.textureType && !value.config?.material) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "textureType or config.material is required",
        path: ["textureType"],
      });
    }
  });

function serializeLabelConfig(
  labelConfig: LabelConfig
) {
  return {
    material: labelConfig.material,
    color: labelConfig.color,
    size: labelConfig.size,
    weaveType: labelConfig.weaveType,
    gridDensity: labelConfig.gridDensity,
    threadAngle: labelConfig.threadAngle,
    glossLevel: labelConfig.glossLevel,
    labelCode: labelConfig.labelCode,
  };
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  label: router({
    generate: publicProcedure
      .input(labelGenerateInputSchema)
      .mutation(async ({ input, ctx }) => {
        const { generateLabel } = await import("./nanoBananaService");
        const { nanoid } = await import("nanoid");
        const {
          createGeneration,
          updateUserCredits,
          markFreeTrialUsed,
          createCreditTransaction,
        } = await import("./db");

        let isFreeTrial = false;
        let userId: number | undefined;

        if (ctx.user) {
          userId = ctx.user.id;
          if (ctx.user.hasUsedFreeTrial === 0) {
            isFreeTrial = true;
          } else if (ctx.user.creditBalance <= 0) {
            throw new Error("Credits insuffisants. Veuillez acheter des credits.");
          }
        } else {
          isFreeTrial = true;
        }

        const logoBase64 = input.logoDataUrl.replace(/^data:[^;]+;base64,/, "");

        const result = await generateLabel({
          logoBase64,
          textureType: input.textureType,
          config: input.config,
          mode: isFreeTrial ? "preview" : "final",
        });

        if (!result.success || !result.imageBase64) {
          throw new Error(result.error || "La generation de l'image a echoue");
        }

        const logoUrl = `data:image/png;base64,${logoBase64}`;
        const labelUrl = `data:image/png;base64,${result.imageBase64}`;
        const logoKey = `inline://logos/${nanoid()}.png`;
        const labelKey = `inline://labels/${nanoid()}.png`;
        const storedOptions = result.labelConfig
          ? {
              ...(input.options ?? {}),
              labelConfig: serializeLabelConfig(result.labelConfig),
            }
          : input.options;

        if (userId) {
          await createGeneration({
            userId,
            logoUrl,
            logoKey,
            labelUrl,
            labelKey,
            textureType: result.labelConfig?.textureTypeLegacy ?? input.textureType ?? "hd",
            options: storedOptions ? JSON.stringify(storedOptions) : null,
            isFreeTrial: isFreeTrial ? 1 : 0,
          });

          if (isFreeTrial) {
            await markFreeTrialUsed(userId);
          } else {
            await updateUserCredits(userId, -1);
            await createCreditTransaction({
              userId,
              amount: -1,
              type: "usage",
              description: "Generation d'etiquette",
            });
          }
        }

        return {
          success: true,
          labelUrl,
          logoUrl,
          isFreeTrial,
        };
      }),

    getUserGenerations: protectedProcedure.query(async ({ ctx }) => {
      const { getUserGenerations } = await import("./db");
      return await getUserGenerations(ctx.user.id);
    }),
  }),

  credits: router({
    getBalance: protectedProcedure.query(({ ctx }) => {
      return {
        balance: ctx.user.creditBalance,
        hasUsedFreeTrial: ctx.user.hasUsedFreeTrial === 1,
      };
    }),

    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCreditTransactions } = await import("./db");
      return await getUserCreditTransactions(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
