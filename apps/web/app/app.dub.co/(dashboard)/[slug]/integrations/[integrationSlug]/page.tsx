import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import IntegrationPageClient from "./page-client";

export const revalidate = 0;

export default async function IntegrationPage({
  params,
}: {
  params: { slug: string; integrationSlug: string };
}) {
  const integration = await prisma.oAuthApp.findUnique({
    where: {
      slug: params.integrationSlug,
    },
    include: {
      _count: {
        select: {
          authorizedApps: true,
        },
      },
      authorizedApps: {
        where: {
          project: {
            slug: params.slug,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!integration) {
    notFound();
  }

  return (
    <IntegrationPageClient
      integration={{
        ...integration,
        screenshots: integration.screenshots as string[],
        installations: integration._count.authorizedApps,
        installed:
          integration.authorizedApps.length > 0
            ? {
                id: integration.authorizedApps[0].id,
                by: {
                  id: integration.authorizedApps[0].userId,
                  name: integration.authorizedApps[0].user.name,
                  image: integration.authorizedApps[0].user.image,
                },
                createdAt: integration.authorizedApps[0].createdAt,
              }
            : null,
      }}
    />
  );
}
