// import InternalPrismaService from '../../prisma/internal-prisma.service';
// import { fetchGoogleRating } from './fetchGoogleRating';

// export async function enrichPendingLeads(prisma: PrismaClient, limit = 10) {
//   const leads = await prisma.lead.findMany({
//     where: { isEnriched: false },
//     take: limit,
//   });

//   if (!leads.length) {
//     return { enriched: 0, skipped: 0 };
//   }

//   let enrichedCount = 0;
//   let skippedCount = 0;

//   for (const lead of leads) {
//     try {
//       const enrichment = await fetchGoogleRating(lead.businessName, lead.city);

//       if (!enrichment) {
//         skippedCount++;
//         continue;
//       }

//       await prisma.lead.update({
//         where: { id: lead.id },
//         data: {
//           googleRating: enrichment.googleRating ?? null,
//           reviewCount: enrichment.totalReviews ?? null,
//           googlePlaceId: enrichment.googlePlaceId ?? null,
//           isEnriched: true,
//         },
//       });

//       enrichedCount++;
//     } catch (err) {
//       skippedCount++;
//     }

//     await new Promise((r) => setTimeout(r, 1200));
//   }

//   return { enriched: enrichedCount, skipped: skippedCount };
// }
