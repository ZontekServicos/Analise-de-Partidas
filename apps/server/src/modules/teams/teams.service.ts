import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { CreateTeamInput, ListTeamsQuery, UpdateTeamInput } from "./teams.schema";

const ensureUniqueTeam = async (data: CreateTeamInput | UpdateTeamInput, currentTeamId?: string) => {
  const filters: Prisma.TeamWhereInput[] = [];

  if (data.name) {
    filters.push({ name: data.name });
  }

  if (data.fifaCode) {
    filters.push({ fifaCode: data.fifaCode });
  }

  if (filters.length === 0) {
    return;
  }

  const existingTeam = await prisma.team.findFirst({
    where: {
      OR: filters,
      ...(currentTeamId ? { NOT: { id: currentTeamId } } : {})
    }
  });

  if (!existingTeam) {
    return;
  }

  if (data.name && existingTeam.name === data.name) {
    throw new AppError("Team name already exists", 409);
  }

  throw new AppError("FIFA code already exists", 409);
};

const findTeamOrFail = async (id: string) => {
  const team = await prisma.team.findUnique({
    where: { id }
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  return team;
};

export const teamsService = {
  async create(data: CreateTeamInput) {
    await ensureUniqueTeam(data);

    return prisma.team.create({
      data
    });
  },

  async list(query: ListTeamsQuery = {}) {
    const where: Prisma.TeamWhereInput = {
      ...(query.teamType ? { teamType: query.teamType } : {}),
      ...(query.country ? { country: { contains: query.country, mode: "insensitive" } } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {})
    };

    return prisma.team.findMany({
      where,
      orderBy: {
        name: "asc"
      }
    });
  },

  async findById(id: string) {
    return findTeamOrFail(id);
  },

  async update(id: string, data: UpdateTeamInput) {
    await findTeamOrFail(id);
    await ensureUniqueTeam(data, id);

    return prisma.team.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    await findTeamOrFail(id);

    const relatedRecords = await prisma.$transaction([
      prisma.match.count({
        where: {
          OR: [{ homeTeamId: id }, { awayTeamId: id }]
        }
      }),
      prisma.teamStats.count({
        where: { teamId: id }
      })
    ]);

    const [matchesCount, statsCount] = relatedRecords;

    if (matchesCount > 0 || statsCount > 0) {
      throw new AppError("Team cannot be deleted because it has related records", 409, {
        matchesCount,
        statsCount
      });
    }

    await prisma.team.delete({
      where: { id }
    });
  }
};
