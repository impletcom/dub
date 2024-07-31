import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { oAuthAppSchema, updateOAuthAppSchema } from "@/lib/zod/schemas/oauth";
import { nanoid, R2_URL } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

// GET /api/oauth/apps/[appId] – get an OAuth app created by the workspace
export const GET = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthApp.findFirst({
      where: {
        id: params.appId,
        projectId: workspace.id,
      },
    });

    if (!app) {
      throw new DubApiError({
        code: "not_found",
        message: `OAuth app with id ${params.appId} not found.`,
      });
    }

    return NextResponse.json(oAuthAppSchema.parse(app));
  },
  {
    requiredPermissions: ["oauth_apps.read"],
    featureFlag: "integrations",
  },
);

// PATCH /api/oauth/apps/[appId] – update an OAuth app
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const {
      name,
      slug,
      developer,
      website,
      description,
      readme,
      redirectUris,
      logo,
      pkce,
    } = updateOAuthAppSchema.parse(await parseRequestBody(req));

    try {
      const app = await prisma.oAuthApp.findUniqueOrThrow({
        where: {
          id: params.appId,
          projectId: workspace.id,
        },
        select: {
          logo: true,
        },
      });

      let logoUrl: string | undefined;
      const logoUpdated = logo && app.logo !== logo;

      // Logo has been changed
      if (logoUpdated) {
        const result = await storage.upload(
          `integrations/${params.appId}_${nanoid(7)}`,
          logo,
        );

        logoUrl = result.url;
      }

      const updatedApp = await prisma.oAuthApp.update({
        where: {
          id: params.appId,
          projectId: workspace.id,
        },
        data: {
          name,
          slug,
          developer,
          website,
          description,
          readme,
          redirectUris,
          pkce,
          ...(logoUrl && { logo: logoUrl }),
        },
      });

      waitUntil(
        (async () => {
          if (
            logoUpdated &&
            app.logo &&
            app.logo.startsWith(`${R2_URL}/integrations`)
          ) {
            await storage.delete(app.logo.replace(`${R2_URL}/`, ""));
          }
        })(),
      );

      return NextResponse.json(oAuthAppSchema.parse(updatedApp));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: `The slug "${slug}" is already in use.`,
        });
      } else {
        throw new DubApiError({
          code: "internal_server_error",
          message: error.message,
        });
      }
    }
  },
  {
    requiredPermissions: ["oauth_apps.write"],
    featureFlag: "integrations",
  },
);

// DELETE /api/oauth/apps/[appId] - delete an OAuth app
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthApp.findFirst({
      where: {
        id: params.appId,
        projectId: workspace.id,
      },
    });

    if (!app) {
      throw new DubApiError({
        code: "not_found",
        message: `OAuth app with id ${params.appId} not found.`,
      });
    }

    await prisma.oAuthApp.delete({
      where: {
        id: params.appId,
      },
    });

    waitUntil(
      (async () => {
        if (app.logo && app.logo.startsWith(`${R2_URL}/integrations`)) {
          await storage.delete(app.logo.replace(`${R2_URL}/`, ""));
        }
      })(),
    );

    return NextResponse.json({ id: params.appId });
  },
  {
    requiredPermissions: ["oauth_apps.write"],
    featureFlag: "integrations",
  },
);
