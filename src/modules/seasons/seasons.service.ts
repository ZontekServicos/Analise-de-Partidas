import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { CreateSeasonInput, ListSeasonsQuery, UpdateSeasonInput } from "./seasons.schema";

const seasonInclude = {
  competition: true
} satisfies Prisma.SeasonInclude;

const ensureCompetitionExists = async (competitionId: string) => {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { id: true }
  });

  if (!competition) {
    throw new AppError("Competition not found", 404);
  }
};

const findSeasonOrFail = async (id: string) => {
  const season = await prisma.season.findUnique({
    where: { id },
    include: seasonInclude
  });

  if (!season) {
    throw new AppError("Season not found", 404);
  }

  return season;
};

export const seasonsService = {
  async create(data: CreateSeasonInput) {
    await ensureCompetitionExists(data.competitionId);

    return prisma.season.create({
      data: {
        competition: { connect: { id: data.competitionId } },
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent
      },
      include: seasonInclude
    });
  },

  async list(query: ListSeasonsQuery) {
    const where: Prisma.SeasonWhereInput = {
      ...(query.competitionId ? { competitionId: query.competitionId } : {}),
      ...(query.isCurrent !== undefined ? { isCurrent: query.isCurrent } : {})
    };

    return prisma.season.findMany({
      where,
      include: seasonInclude,
      orderBy: { startDate: "desc" }
    });
  },

  async findById(id: string) {
    return findSeasonOrFail(id);
  },

  async update(id: string, data: UpdateSeasonInput) {
    await findSeasonOrFail(id);

    if (data.competitionId) {
      await ensureCompetitionExists(data.competitionId);
    }

    return prisma.season.update({
      where: { id },
      data: {
        ...(data.competitionId !== undefined ? { competition: { connect: { id: data.competitionId } } } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.isCurrent !== undefined ? { isCurrent: data.isCurrent } : {})
      },
      include: seasonInclude
    });
  },

  async delete(id: string) {
    await findSeasonOrFail(id);

    const relatedRecords = await prisma.$transaction([
      prisma.match.count({ where: { seasonId: id } }),
      prisma.teamStats.count({ where: { seasonId: id } })
    ]);

    const [matchesCount, statsCount] = relatedRecords;

    if (matchesCount > 0 || statsCount > 0) {
      throw new AppError("Season cannot be deleted because it has related records", 409, {
        matchesCount,
        statsCount
      });
    }

    await prisma.season.delete({ where: { id } });
  }
};
