import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { CreateCompetitionInput, ListCompetitionsQuery, UpdateCompetitionInput } from "./competitions.schema";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

const findCompetitionOrFail = async (id: string) => {
  const competition = await prisma.competition.findUnique({ where: { id } });

  if (!competition) {
    throw new AppError("Competition not found", 404);
  }

  return competition;
};

const ensureUniqueSlug = async (slug: string, currentCompetitionId?: string) => {
  const existing = await prisma.competition.findUnique({ where: { slug } });

  if (existing && existing.id !== currentCompetitionId) {
    throw new AppError("Competition slug already exists", 409);
  }
};

export const competitionsService = {
  async create(data: CreateCompetitionInput) {
    const slug = slugify(data.slug ?? data.name);
    await ensureUniqueSlug(slug);

    return prisma.competition.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        country: data.country,
        confederation: data.confederation,
        isInternational: data.isInternational
      }
    });
  },

  async list(query: ListCompetitionsQuery) {
    const where: Prisma.CompetitionWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.country ? { country: { contains: query.country, mode: "insensitive" } } : {}),
      ...(query.isInternational !== undefined ? { isInternational: query.isInternational } : {})
    };

    return prisma.competition.findMany({
      where,
      orderBy: { name: "asc" }
    });
  },

  async findById(id: string) {
    return findCompetitionOrFail(id);
  },

  async update(id: string, data: UpdateCompetitionInput) {
    await findCompetitionOrFail(id);

    // Slug so regenerates when explicitly provided; renaming a competition does not silently change its slug/URL.
    const slug = data.slug !== undefined ? slugify(data.slug) : undefined;

    if (slug !== undefined) {
      await ensureUniqueSlug(slug, id);
    }

    return prisma.competition.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.confederation !== undefined ? { confederation: data.confederation } : {}),
        ...(data.isInternational !== undefined ? { isInternational: data.isInternational } : {})
      }
    });
  },

  async delete(id: string) {
    await findCompetitionOrFail(id);

    const relatedRecords = await prisma.$transaction([
      prisma.match.count({ where: { competitionId: id } }),
      prisma.season.count({ where: { competitionId: id } }),
      prisma.teamStats.count({ where: { competitionId: id } })
    ]);

    const [matchesCount, seasonsCount, statsCount] = relatedRecords;

    if (matchesCount > 0 || seasonsCount > 0 || statsCount > 0) {
      throw new AppError("Competition cannot be deleted because it has related records", 409, {
        matchesCount,
        seasonsCount,
        statsCount
      });
    }

    await prisma.competition.delete({ where: { id } });
  }
};
