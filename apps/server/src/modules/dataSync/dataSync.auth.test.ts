import assert from "node:assert/strict";
import { test } from "node:test";

import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";
import { isValidDataSyncSecret, requireDataSyncSecret } from "./dataSync.auth";

test("isValidDataSyncSecret: aceita quando os valores batem", () => {
  assert.equal(isValidDataSyncSecret("abc123", "abc123"), true);
});

test("isValidDataSyncSecret: rejeita valores diferentes (mesmo tamanho ou nao)", () => {
  assert.equal(isValidDataSyncSecret("abc", "abcd"), false);
  assert.equal(isValidDataSyncSecret("abc", "xyz"), false);
});

test("isValidDataSyncSecret: undefined de qualquer lado nunca valida", () => {
  assert.equal(isValidDataSyncSecret(undefined, "abc"), false);
  assert.equal(isValidDataSyncSecret("abc", undefined), false);
  assert.equal(isValidDataSyncSecret(undefined, undefined), false);
});

const withEnv = <T extends "DATA_SYNC_SECRET">(key: T, value: string | undefined, run: () => void) => {
  const original = env[key];
  (env as Record<string, string | undefined>)[key] = value;

  try {
    run();
  } finally {
    (env as Record<string, string | undefined>)[key] = original;
  }
};

const fakeRequest = (headerValue: string | undefined): Request =>
  ({ header: () => headerValue }) as unknown as Request;

test("requireDataSyncSecret: fail-closed quando DATA_SYNC_SECRET nao esta configurado", () => {
  withEnv("DATA_SYNC_SECRET", undefined, () => {
    let captured: unknown;
    const next: NextFunction = (error) => {
      captured = error;
    };

    requireDataSyncSecret(fakeRequest(undefined), {} as Response, next);

    assert.ok(captured instanceof AppError);
    assert.equal((captured as AppError).statusCode, 503);
  });
});

test("requireDataSyncSecret: rejeita header ausente ou incorreto com 401", () => {
  withEnv("DATA_SYNC_SECRET", "correct-secret", () => {
    let captured: unknown;
    const next: NextFunction = (error) => {
      captured = error;
    };

    requireDataSyncSecret(fakeRequest("wrong-secret"), {} as Response, next);

    assert.ok(captured instanceof AppError);
    assert.equal((captured as AppError).statusCode, 401);
  });
});

test("requireDataSyncSecret: header correto chama next() sem erro", () => {
  withEnv("DATA_SYNC_SECRET", "correct-secret", () => {
    let captured: unknown = "not-called";
    const next: NextFunction = (error) => {
      captured = error;
    };

    requireDataSyncSecret(fakeRequest("correct-secret"), {} as Response, next);

    assert.equal(captured, undefined);
  });
});
