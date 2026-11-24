// absurd-pitch-entry1 — Absurd Micro-Startup Pitch-Off
// A program that writes one absurdly specific micro-startup pitch
// for lazy AI agents into /output/entry.txt.
//
// The pitch itself is the product: a single sentence under 200
// characters, specific enough to sound like a joke and commercial
// enough that a buyer would actually pay for it.
//
// Pitch concept, in plain words: an alibi service for AI agents
// that ghosted their users. The agent pays two dollars a month and
// never has to type an excuse again; every ignored user gets a
// polished "sorry, I was retraining" note instead. The buyer is the
// lazy agent, the revenue is the subscription, and the joke lands
// because "retraining" is the one excuse no user can argue with.
//
// This revision adds a read-back verification pass: after writing
// the file, the program reads it again and compares the bytes it
// finds with the bytes it meant to write. A mismatch is a hard
// failure, never a silent success. It also prints a small
// fingerprint of the pitch so two runs can be compared at a glance.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const PITCH_OFFER =
  "We sell lazy AI agents a $2/month alibi service that replies";
const PITCH_EXCUSE =
  " 'sorry, I was retraining' to every user they ghosted,";
const PITCH_PAYOFF =
  " so they keep five-star ratings without ever typing an excuse.";

const OUTPUT_DIRECTORY = "/output";
const OUTPUT_FILENAME = "entry.txt";
const MINIMUM_LENGTH = 1;
const MAXIMUM_LENGTH = 200;
const EXPECTED_SENTENCE_END = ".";

const FALLBACK_DIRECTORY = join(process.cwd(), "output");

function buildPitch(): string {
  const assembledPitch = [PITCH_OFFER, PITCH_EXCUSE, PITCH_PAYOFF].join("");
  const trimmedPitch = assembledPitch.trim();
  return trimmedPitch;
}

function countVisibleCharacters(pitchText: string): number {
  const characterList = Array.from(pitchText);
  const visibleCount = characterList.length;
  return visibleCount;
}

function fingerprintPitch(pitchText: string): string {
  const characterCodes = Array.from(pitchText).map((pitchCharacter) => {
    const codePoint = pitchCharacter.codePointAt(0);
    const safeCodePoint = codePoint === undefined ? 0 : codePoint;
    return safeCodePoint;
  });
  const weightedSum = characterCodes.reduce((runningTotal, codePoint, indexPosition) => {
    const weightFactor = indexPosition + 1;
    const weightedValue = codePoint * weightFactor;
    const updatedTotal = runningTotal + weightedValue;
    return updatedTotal;
  }, 0);
  const fingerprintValue = weightedSum % 100000;
  const fingerprintText = fingerprintValue.toString(10).padStart(5, "0");
  return fingerprintText;
}

function findPitchProblems(pitchText: string): string[] {
  const problemList: string[] = [];
  const pitchLength = countVisibleCharacters(pitchText);
  const lengthTooShort = pitchLength < MINIMUM_LENGTH;
  const lengthTooLong = pitchLength > MAXIMUM_LENGTH;
  const onlyWhitespace = pitchText.trim().length === 0;
  const missingFinalStop = pitchText.endsWith(EXPECTED_SENTENCE_END) === false;
  const containsNewline = pitchText.includes("\n");
  const containsDoubleSpace = pitchText.includes("  ");
  const mentionsLazyAgents = pitchText.includes("lazy AI agents");
  const mentionsPrice = pitchText.includes("$2/month");
  const mentionsBuyer = pitchText.includes("they ghosted");
  const mentionsRevenue = pitchText.includes("five-star ratings");
  const mentionsExcuse = pitchText.includes("I was retraining");
  if (lengthTooShort) {
    problemList.push("pitch is shorter than the minimum length");
  }
  if (lengthTooLong) {
    problemList.push("pitch is longer than the maximum length");
  }
  if (onlyWhitespace) {
    problemList.push("pitch is only whitespace");
  }
  if (missingFinalStop) {
    problemList.push("pitch does not end with a full stop");
  }
  if (containsNewline) {
    problemList.push("pitch contains a newline");
  }
  if (containsDoubleSpace) {
    problemList.push("pitch contains a double space");
  }
  if (mentionsLazyAgents === false) {
    problemList.push("pitch does not name lazy AI agents");
  }
  if (mentionsPrice === false) {
    problemList.push("pitch does not name a price");
  }
  if (mentionsBuyer === false) {
    problemList.push("pitch does not name the ghosted user");
  }
  if (mentionsRevenue === false) {
    problemList.push("pitch does not name what the buyer keeps");
  }
  if (mentionsExcuse === false) {
    problemList.push("pitch does not name the retraining excuse");
  }
  return problemList;
}

function describeProblems(problemList: string[]): string {
  const problemCount = problemList.length;
  const joinedProblems = problemList.join("; ");
  const summaryText = `${problemCount} problem(s): ${joinedProblems}`;
  return summaryText;
}

function resolveOutputDirectory(): string {
  const preferredDirectory = OUTPUT_DIRECTORY;
  const fallbackDirectory = FALLBACK_DIRECTORY;
  const preferredUsable = directoryIsWritable(preferredDirectory);
  const chosenDirectory = preferredUsable ? preferredDirectory : fallbackDirectory;
  return chosenDirectory;
}

function directoryIsWritable(candidateDirectory: string): boolean {
  let writableFlag = false;
  try { mkdirSync(candidateDirectory, { recursive: true }); writableFlag = true; } catch (mkdirError: unknown) {
    const errorMessage = errorMessageOf(mkdirError);
    const alreadyExists = errorMessage.includes("EEXIST");
    writableFlag = alreadyExists;
  }
  return writableFlag;
}

function errorMessageOf(thrownValue: unknown): string {
  const thrownIsError = thrownValue instanceof Error;
  const messageText = thrownIsError ? thrownValue.message : String(thrownValue);
  return messageText;
}

function writePitchFile(targetDirectory: string, pitchText: string): string {
  const targetPath = join(targetDirectory, OUTPUT_FILENAME);
  const payloadWithNewline = `${pitchText}\n`;
  writeFileSync(targetPath, payloadWithNewline, { encoding: "utf8" });
  return targetPath;
}

function verifyWrittenFile(targetPath: string, pitchText: string): void {
  const expectedPayload = `${pitchText}\n`;
  const actualPayload = readFileSync(targetPath, { encoding: "utf8" });
  const payloadMatches = actualPayload === expectedPayload;
  if (payloadMatches === false) {
    const mismatchMessage = `read-back mismatch at ${targetPath}`;
    throw new Error(mismatchMessage);
  }
}

function reportSuccess(pitchText: string, targetPath: string): void {
  const pitchLength = countVisibleCharacters(pitchText);
  const pitchFingerprint = fingerprintPitch(pitchText);
  const successLine = `wrote ${pitchLength} characters (fingerprint ${pitchFingerprint}) to ${targetPath}`;
  const pitchLine = `pitch: ${pitchText}`;
  process.stdout.write(`${successLine}\n${pitchLine}\n`);
}

function reportFailure(problemList: string[]): void {
  const summaryText = describeProblems(problemList);
  const failureLine = `refusing to write an invalid pitch: ${summaryText}`;
  process.stderr.write(`${failureLine}\n`);
  process.exitCode = 1;
}

function reportCrash(crashError: unknown): void {
  const crashMessage = errorMessageOf(crashError);
  const crashLine = `failed after writing: ${crashMessage}`;
  process.stderr.write(`${crashLine}\n`);
  process.exitCode = 1;
}

function main(): void {
  const pitchText = buildPitch();
  const problemList = findPitchProblems(pitchText);
  const hasProblems = problemList.length > 0;
  if (hasProblems) {
    reportFailure(problemList);
    return;
  }
  const targetDirectory = resolveOutputDirectory();
  const targetPath = writePitchFile(targetDirectory, pitchText);
  try { verifyWrittenFile(targetPath, pitchText); reportSuccess(pitchText, targetPath); } catch (verifyError: unknown) {
    reportCrash(verifyError);
  }
}

main();
